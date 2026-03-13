/**
 * Copyright © 2016-2025 The Thingsboard Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.thingsboard.server.service.alexa;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.queue.util.TbCoreComponent;
import org.thingsboard.server.service.alexa.dto.AppLinkingStartResponse;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
@TbCoreComponent
@RequiredArgsConstructor
public class AlexaAppLinkingServiceImpl implements AlexaAppLinkingService {

    private final AlexaOAuth2Service alexaOAuth2Service;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static final String LWA_TOKEN_URL = "https://api.amazon.com/auth/o2/token";
    private static final String ALEXA_APP_URL_BASE = "https://alexa.amazon.com/spa/skill-account-linking-consent";
    private static final String LWA_AUTH_URL_BASE = "https://www.amazon.com/ap/oa";
    private static final String SKILL_ENABLEMENT_API_BASE = "https://api.amazonalexa.com";
    private static final String SCOPE = "alexa::skills:account_linking";
    private static final long STATE_EXPIRY_MINUTES = 10;

    @Value("${alexa.app_linking.alexa_client_id:}")
    private String alexaClientId;

    @Value("${alexa.app_linking.alexa_client_secret:}")
    private String alexaClientSecret;

    @Value("${alexa.app_linking.skill_id:}")
    private String skillId;

    @Value("${alexa.app_linking.redirect_uri:}")
    private String redirectUri;

    @Value("${alexa.app_linking.app_callback_scheme:osprey://alexa-callback}")
    private String appCallbackScheme;

    @Value("${alexa.app_linking.skill_stage:development}")
    private String skillStage;

    // In-memory store for state → session data (PKCE + user info)
    // In production, this should be persisted to DB or Redis
    private final ConcurrentHashMap<String, LinkingSession> pendingSessions = new ConcurrentHashMap<>();

    @Override
    public AppLinkingStartResponse startLinking(TenantId tenantId, UserId userId) {
        // Generate state
        String state = generateSecureToken(32);

        // Generate PKCE code_verifier and code_challenge
        String codeVerifier = generateCodeVerifier();
        String codeChallenge = generateCodeChallenge(codeVerifier);

        // Store session
        LinkingSession session = new LinkingSession(tenantId, userId, codeVerifier, Instant.now());
        pendingSessions.put(state, session);

        // Build URLs
        String alexaAppUrl = buildAlexaAppUrl(state, codeChallenge);
        String lwaFallbackUrl = buildLwaFallbackUrl(state, codeChallenge);

        log.info("Started app-to-app linking for user: {}, state: {}", userId, state);

        return AppLinkingStartResponse.builder()
                .alexaAppUrl(alexaAppUrl)
                .lwaFallbackUrl(lwaFallbackUrl)
                .state(state)
                .build();
    }

    @Override
    public void completeLinking(TenantId tenantId, UserId userId, String amazonAuthCode, String state) {
        // Validate state and get session
        LinkingSession session = pendingSessions.remove(state);
        if (session == null) {
            throw new IllegalArgumentException("Invalid or expired state parameter");
        }
        if (session.isExpired()) {
            throw new IllegalArgumentException("Linking session has expired");
        }
        if (!session.userId.equals(userId)) {
            throw new IllegalArgumentException("User mismatch for linking session");
        }

        // Step 5: Exchange Amazon auth code for Amazon access token
        String amazonAccessToken = exchangeAmazonCode(amazonAuthCode, session.codeVerifier);

        // Step 7: Generate ThingsBoard auth code for this user
        String alexaUserId = UUID.randomUUID().toString();
        String tbAuthCode = alexaOAuth2Service.generateAuthorizationCode(tenantId, userId, alexaUserId);

        // Step 8: Call Skill Enablement API
        enableSkill(amazonAccessToken, tbAuthCode);

        log.info("App-to-app linking completed for user: {}", userId);
    }

    @Override
    public UserId validateState(String state) {
        LinkingSession session = pendingSessions.get(state);
        if (session == null || session.isExpired()) {
            throw new IllegalArgumentException("Invalid or expired state");
        }
        return session.userId;
    }

    @Override
    public String getAppCallbackScheme() {
        return appCallbackScheme;
    }

    // ============== Private Methods ==============

    private String buildAlexaAppUrl(String state, String codeChallenge) {
        return ALEXA_APP_URL_BASE + "?" +
                "fragment=skill-account-linking-consent" +
                "&client_id=" + encode(alexaClientId) +
                "&scope=" + encode(SCOPE) +
                "&skill_stage=" + encode(skillStage) +
                "&response_type=code" +
                "&redirect_uri=" + encode(redirectUri) +
                "&state=" + encode(state) +
                "&code_challenge=" + encode(codeChallenge) +
                "&code_challenge_method=S256";
    }

    private String buildLwaFallbackUrl(String state, String codeChallenge) {
        return LWA_AUTH_URL_BASE + "?" +
                "client_id=" + encode(alexaClientId) +
                "&scope=" + encode(SCOPE) +
                "&response_type=code" +
                "&redirect_uri=" + encode(redirectUri) +
                "&state=" + encode(state) +
                "&code_challenge=" + encode(codeChallenge) +
                "&code_challenge_method=S256";
    }

    private String exchangeAmazonCode(String amazonAuthCode, String codeVerifier) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("code", amazonAuthCode);
        body.add("client_id", alexaClientId);
        body.add("client_secret", alexaClientSecret);
        body.add("redirect_uri", redirectUri);
        body.add("code_verifier", codeVerifier);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    LWA_TOKEN_URL, HttpMethod.POST, request, String.class);

            JsonNode json = objectMapper.readTree(response.getBody());

            if (json.has("error")) {
                String error = json.get("error").asText();
                String desc = json.has("error_description") ? json.get("error_description").asText() : "";
                log.error("LWA token exchange failed: {} - {}", error, desc);
                throw new RuntimeException("Amazon token exchange failed: " + error);
            }

            String accessToken = json.get("access_token").asText();
            log.debug("Successfully exchanged Amazon auth code for access token");
            return accessToken;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to exchange Amazon authorization code", e);
            throw new RuntimeException("Failed to exchange Amazon authorization code", e);
        }
    }

    private void enableSkill(String amazonAccessToken, String tbAuthCode) {
        String url = SKILL_ENABLEMENT_API_BASE + "/v1/users/~current/skills/" + skillId + "/enablement";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(amazonAccessToken);

        Map<String, Object> body = Map.of(
                "stage", skillStage,
                "accountLinkRequest", Map.of(
                        "redirectUri", redirectUri,
                        "authCode", tbAuthCode,
                        "type", "AUTH_CODE"
                )
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Alexa skill enabled and account linked successfully");
            } else {
                log.error("Skill enablement failed with status: {}", response.getStatusCode());
                throw new RuntimeException("Skill enablement failed: " + response.getStatusCode());
            }
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.CONFLICT) {
                // 409 = skill already enabled, treat as success
                log.info("Alexa skill already enabled (409 Conflict), treating as success");
            } else {
                log.error("Skill enablement failed: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
                throw new RuntimeException("Skill enablement failed: " + e.getMessage(), e);
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to enable Alexa skill", e);
            throw new RuntimeException("Failed to enable Alexa skill", e);
        }
    }

    // ============== PKCE Helpers ==============

    private String generateCodeVerifier() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String generateCodeChallenge(String codeVerifier) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(codeVerifier.getBytes(StandardCharsets.US_ASCII));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate code challenge", e);
        }
    }

    private String generateSecureToken(int byteLength) {
        byte[] bytes = new byte[byteLength];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    // ============== Session Data ==============

    private static class LinkingSession {
        final TenantId tenantId;
        final UserId userId;
        final String codeVerifier;
        final Instant createdAt;

        LinkingSession(TenantId tenantId, UserId userId, String codeVerifier, Instant createdAt) {
            this.tenantId = tenantId;
            this.userId = userId;
            this.codeVerifier = codeVerifier;
            this.createdAt = createdAt;
        }

        boolean isExpired() {
            return Instant.now().isAfter(createdAt.plusSeconds(STATE_EXPIRY_MINUTES * 60));
        }
    }
}
