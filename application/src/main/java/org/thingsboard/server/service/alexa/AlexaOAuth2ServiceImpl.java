/**
 * Copyright © 2016-2024 The Thingsboard Authors
 * Copyright © 2024 PachiraMining
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

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.dao.alexa.AlexaOAuth2AuthCodeDao;
import org.thingsboard.server.dao.alexa.AlexaOAuth2TokenDao;
import org.thingsboard.server.dao.model.sql.AlexaOAuth2AuthCodeEntity;
import org.thingsboard.server.dao.model.sql.AlexaOAuth2TokenEntity;
import org.thingsboard.server.queue.util.TbCoreComponent;
import org.thingsboard.server.service.alexa.dto.AlexaOAuth2TokenResponse;

import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@TbCoreComponent
@RequiredArgsConstructor
public class AlexaOAuth2ServiceImpl implements AlexaOAuth2Service {

    private final AlexaOAuth2TokenDao tokenDao;
    private final AlexaOAuth2AuthCodeDao authCodeDao;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int AUTH_CODE_LENGTH = 32;
    private static final int TOKEN_LENGTH = 64;
    private static final long AUTH_CODE_EXPIRY_MINUTES = 10;
    private static final long ACCESS_TOKEN_EXPIRY_HOURS = 1;
    private static final long REFRESH_TOKEN_EXPIRY_DAYS = 30;

    @Value("${alexa.oauth.client_id:}")
    private String configuredClientId;

    @Value("${alexa.oauth.client_secret:}")
    private String configuredClientSecret;

    @Override
    @Transactional
    public String generateAuthorizationCode(TenantId tenantId, UserId userId, String alexaUserId) {
        log.debug("Generating authorization code for tenant: {}, user: {}, alexaUserId: {}",
            tenantId, userId, alexaUserId);

        String code = generateSecureToken(AUTH_CODE_LENGTH);
        Timestamp now = Timestamp.from(Instant.now());
        Timestamp expiresAt = Timestamp.from(Instant.now().plus(AUTH_CODE_EXPIRY_MINUTES, ChronoUnit.MINUTES));

        AlexaOAuth2AuthCodeEntity authCode = new AlexaOAuth2AuthCodeEntity(
            code,
            tenantId.getId(),
            userId.getId(),
            alexaUserId,
            now,
            expiresAt,
            false
        );

        authCodeDao.save(authCode);
        log.debug("Authorization code generated successfully: {}", code.substring(0, 10) + "...");

        return code;
    }

    @Override
    @Transactional
    public AlexaOAuth2TokenResponse exchangeCodeForToken(String authCode, String clientId, String clientSecret) {
        log.debug("Exchanging authorization code for token");

        // Validate client credentials
        if (!validateClientCredentials(clientId, clientSecret)) {
            log.warn("Invalid client credentials");
            return AlexaOAuth2TokenResponse.builder()
                .error("invalid_client")
                .errorDescription("Invalid client credentials")
                .build();
        }

        // Find and validate authorization code
        Optional<AlexaOAuth2AuthCodeEntity> authCodeOpt = authCodeDao.findByCodeAndNotUsed(authCode);
        if (authCodeOpt.isEmpty()) {
            log.warn("Authorization code not found or already used: {}", authCode.substring(0, Math.min(10, authCode.length())) + "...");
            return AlexaOAuth2TokenResponse.builder()
                .error("invalid_grant")
                .errorDescription("Authorization code is invalid or expired")
                .build();
        }

        AlexaOAuth2AuthCodeEntity authCodeEntity = authCodeOpt.get();

        // Check if code is expired
        if (authCodeEntity.getExpiresAt().before(Timestamp.from(Instant.now()))) {
            log.warn("Authorization code expired");
            authCodeDao.deleteByCode(authCode);
            return AlexaOAuth2TokenResponse.builder()
                .error("invalid_grant")
                .errorDescription("Authorization code has expired")
                .build();
        }

        // Mark authorization code as used
        authCodeDao.markAsUsed(authCode);

        // Generate tokens
        String accessToken = generateSecureToken(TOKEN_LENGTH);
        String refreshToken = generateSecureToken(TOKEN_LENGTH);
        Timestamp now = Timestamp.from(Instant.now());
        Timestamp accessTokenExpiry = Timestamp.from(Instant.now().plus(ACCESS_TOKEN_EXPIRY_HOURS, ChronoUnit.HOURS));

        // Delete any existing token for this Alexa user
        tokenDao.deleteByAlexaUserId(authCodeEntity.getAlexaUserId());

        // Save new token
        AlexaOAuth2TokenEntity tokenEntity = new AlexaOAuth2TokenEntity(
            UUID.randomUUID(),
            authCodeEntity.getTenantId(),
            authCodeEntity.getUserId(),
            authCodeEntity.getAlexaUserId(),
            accessToken,
            refreshToken,
            accessTokenExpiry,
            now,
            now
        );

        tokenDao.save(tokenEntity);

        log.debug("Tokens generated successfully for alexaUserId: {}", authCodeEntity.getAlexaUserId());

        long expiresIn = ChronoUnit.SECONDS.between(now.toInstant(), accessTokenExpiry.toInstant());

        return AlexaOAuth2TokenResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(expiresIn)
                .refreshToken(refreshToken)
                .build();
    }

    @Override
    @Transactional
    public AlexaOAuth2TokenResponse refreshAccessToken(String refreshToken, String clientId, String clientSecret) {
        log.debug("Refreshing access token");

        // Validate client credentials
        if (!validateClientCredentials(clientId, clientSecret)) {
            log.warn("Invalid client credentials");
            return AlexaOAuth2TokenResponse.builder()
                .error("invalid_client")
                .errorDescription("Invalid client credentials")
                .build();
        }

        // Find token by refresh token
        Optional<AlexaOAuth2TokenEntity> tokenOpt = tokenDao.findByRefreshToken(refreshToken);
        if (tokenOpt.isEmpty()) {
            log.warn("Refresh token not found");
            return AlexaOAuth2TokenResponse.builder()
                .error("invalid_grant")
                .errorDescription("Refresh token is invalid")
                .build();
        }

        AlexaOAuth2TokenEntity tokenEntity = tokenOpt.get();

        // Generate new access token
        String newAccessToken = generateSecureToken(TOKEN_LENGTH);
        Timestamp now = Timestamp.from(Instant.now());
        Timestamp accessTokenExpiry = Timestamp.from(Instant.now().plus(ACCESS_TOKEN_EXPIRY_HOURS, ChronoUnit.HOURS));

        tokenEntity.setAccessToken(newAccessToken);
        tokenEntity.setExpiresAt(accessTokenExpiry);
        tokenEntity.setUpdatedAt(now);

        tokenDao.save(tokenEntity);

        log.debug("Access token refreshed successfully for alexaUserId: {}", tokenEntity.getAlexaUserId());

        long expiresIn = ChronoUnit.SECONDS.between(now.toInstant(), accessTokenExpiry.toInstant());

        return AlexaOAuth2TokenResponse.builder()
                .accessToken(newAccessToken)
                .tokenType("Bearer")
                .expiresIn(expiresIn)
                .build();
    }

    @Override
    @Transactional
    public void revokeToken(String accessToken) {
        log.debug("Revoking access token");
        tokenDao.deleteByAccessToken(accessToken);
    }

    @Override
    @Transactional
    public void revokeTokenByAlexaUserId(String alexaUserId) {
        log.debug("Revoking all tokens for alexaUserId: {}", alexaUserId);
        tokenDao.deleteByAlexaUserId(alexaUserId);
    }

    @Override
    public AlexaOAuth2TokenEntity validateAndGetToken(String accessToken) {
        Optional<AlexaOAuth2TokenEntity> tokenOpt = tokenDao.findByAccessToken(accessToken);

        if (tokenOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid access token");
        }

        AlexaOAuth2TokenEntity token = tokenOpt.get();

        // Check if token is expired
        if (token.getExpiresAt().before(Timestamp.from(Instant.now()))) {
            throw new IllegalArgumentException("Access token has expired");
        }

        return token;
    }

    @Override
    public TenantId getTenantIdFromToken(String accessToken) {
        AlexaOAuth2TokenEntity token = validateAndGetToken(accessToken);
        return token.toTenantId();
    }

    @Override
    public UserId getUserIdFromToken(String accessToken) {
        AlexaOAuth2TokenEntity token = validateAndGetToken(accessToken);
        return token.toUserId();
    }

    @Override
    @Transactional
    public int cleanupExpiredTokens() {
        log.debug("Cleaning up expired tokens and authorization codes");
        Timestamp now = Timestamp.from(Instant.now());

        int expiredTokens = tokenDao.deleteExpiredTokens(now);
        int expiredCodes = authCodeDao.deleteExpiredCodes(now);

        int total = expiredTokens + expiredCodes;
        if (total > 0) {
            log.info("Cleaned up {} expired tokens and {} expired authorization codes",
                expiredTokens, expiredCodes);
        }

        return total;
    }

    private boolean validateClientCredentials(String clientId, String clientSecret) {
        // If not configured, allow any credentials (for development)
        if (configuredClientId == null || configuredClientId.isEmpty()) {
            log.warn("Alexa OAuth client credentials not configured - allowing any credentials");
            return true;
        }
        return configuredClientId.equals(clientId) && configuredClientSecret.equals(clientSecret);
    }

    private String generateSecureToken(int length) {
        byte[] randomBytes = new byte[length];
        SECURE_RANDOM.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }
}
