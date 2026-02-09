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
package org.thingsboard.server.service.google;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.dao.google.GoogleOAuth2AuthCodeDao;
import org.thingsboard.server.dao.google.GoogleOAuth2TokenDao;
import org.thingsboard.server.dao.model.sql.GoogleOAuth2AuthCodeEntity;
import org.thingsboard.server.dao.model.sql.GoogleOAuth2TokenEntity;
import org.thingsboard.server.queue.util.TbCoreComponent;
import org.thingsboard.server.service.google.dto.GoogleOAuth2TokenResponse;

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
public class GoogleOAuth2ServiceImpl implements GoogleOAuth2Service {

    private final GoogleOAuth2TokenDao tokenDao;
    private final GoogleOAuth2AuthCodeDao authCodeDao;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int AUTH_CODE_LENGTH = 32;
    private static final int TOKEN_LENGTH = 64;
    private static final long AUTH_CODE_EXPIRY_MINUTES = 10;
    private static final long ACCESS_TOKEN_EXPIRY_HOURS = 1;
    private static final long REFRESH_TOKEN_EXPIRY_DAYS = 30;

    @Value("${google.oauth.client_id:}")
    private String configuredClientId;

    @Value("${google.oauth.client_secret:}")
    private String configuredClientSecret;

    @Override
    @Transactional
    public String generateAuthorizationCode(TenantId tenantId, UserId userId, String googleUserId) {
        log.debug("Generating authorization code for tenant: {}, user: {}, googleUserId: {}",
            tenantId, userId, googleUserId);

        String code = generateSecureToken(AUTH_CODE_LENGTH);
        Timestamp now = Timestamp.from(Instant.now());
        Timestamp expiresAt = Timestamp.from(Instant.now().plus(AUTH_CODE_EXPIRY_MINUTES, ChronoUnit.MINUTES));

        GoogleOAuth2AuthCodeEntity authCode = new GoogleOAuth2AuthCodeEntity(
            code,
            tenantId.getId(),
            userId.getId(),
            googleUserId,
            now,
            expiresAt,
            false
        );

        authCodeDao.save(authCode);
        log.debug("Authorization code generated successfully: {}", code);

        return code;
    }

    @Override
    @Transactional
    public GoogleOAuth2TokenResponse exchangeCodeForToken(String authCode, String clientId, String clientSecret) {
        log.debug("Exchanging authorization code for token");

        // Validate client credentials
        if (!validateClientCredentials(clientId, clientSecret)) {
            log.warn("Invalid client credentials");
            return GoogleOAuth2TokenResponse.builder()
                .error("invalid_client")
                .errorDescription("Invalid client credentials")
                .build();
        }

        // Find and validate authorization code
        Optional<GoogleOAuth2AuthCodeEntity> authCodeOpt = authCodeDao.findByCodeAndNotUsed(authCode);
        if (authCodeOpt.isEmpty()) {
            log.warn("Authorization code not found or already used: {}", authCode);
            return GoogleOAuth2TokenResponse.builder()
                .error("invalid_grant")
                .errorDescription("Authorization code is invalid or expired")
                .build();
        }

        GoogleOAuth2AuthCodeEntity authCodeEntity = authCodeOpt.get();

        // Check if code is expired
        if (authCodeEntity.getExpiresAt().before(Timestamp.from(Instant.now()))) {
            log.warn("Authorization code expired: {}", authCode);
            authCodeDao.deleteByCode(authCode);
            return GoogleOAuth2TokenResponse.builder()
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

        // Delete any existing token for this Google user
        tokenDao.deleteByGoogleUserId(authCodeEntity.getGoogleUserId());

        // Save new token
        GoogleOAuth2TokenEntity tokenEntity = new GoogleOAuth2TokenEntity(
            UUID.randomUUID(),
            authCodeEntity.getTenantId(),
            authCodeEntity.getUserId(),
            authCodeEntity.getGoogleUserId(),
            accessToken,
            refreshToken,
            accessTokenExpiry,
            now,
            now
        );

        tokenDao.save(tokenEntity);

        log.debug("Tokens generated successfully for googleUserId: {}", authCodeEntity.getGoogleUserId());

        long expiresIn = ChronoUnit.SECONDS.between(now.toInstant(), accessTokenExpiry.toInstant());

        return GoogleOAuth2TokenResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(expiresIn)
                .refreshToken(refreshToken)
                .build();
    }

    @Override
    @Transactional
    public GoogleOAuth2TokenResponse refreshAccessToken(String refreshToken, String clientId, String clientSecret) {
        log.debug("Refreshing access token");

        // Validate client credentials
        if (!validateClientCredentials(clientId, clientSecret)) {
            log.warn("Invalid client credentials");
            return GoogleOAuth2TokenResponse.builder()
                .error("invalid_client")
                .errorDescription("Invalid client credentials")
                .build();
        }

        // Find token by refresh token
        Optional<GoogleOAuth2TokenEntity> tokenOpt = tokenDao.findByRefreshToken(refreshToken);
        if (tokenOpt.isEmpty()) {
            log.warn("Refresh token not found: {}", refreshToken);
            return GoogleOAuth2TokenResponse.builder()
                .error("invalid_grant")
                .errorDescription("Refresh token is invalid")
                .build();
        }

        GoogleOAuth2TokenEntity tokenEntity = tokenOpt.get();

        // Generate new access token
        String newAccessToken = generateSecureToken(TOKEN_LENGTH);
        Timestamp now = Timestamp.from(Instant.now());
        Timestamp accessTokenExpiry = Timestamp.from(Instant.now().plus(ACCESS_TOKEN_EXPIRY_HOURS, ChronoUnit.HOURS));

        tokenEntity.setAccessToken(newAccessToken);
        tokenEntity.setExpiresAt(accessTokenExpiry);
        tokenEntity.setUpdatedAt(now);

        tokenDao.save(tokenEntity);

        log.debug("Access token refreshed successfully for googleUserId: {}", tokenEntity.getGoogleUserId());

        long expiresIn = ChronoUnit.SECONDS.between(now.toInstant(), accessTokenExpiry.toInstant());

        return GoogleOAuth2TokenResponse.builder()
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
    public void revokeTokenByGoogleUserId(String googleUserId) {
        log.debug("Revoking all tokens for googleUserId: {}", googleUserId);
        tokenDao.deleteByGoogleUserId(googleUserId);
    }

    @Override
    public GoogleOAuth2TokenEntity validateAndGetToken(String accessToken) {
        Optional<GoogleOAuth2TokenEntity> tokenOpt = tokenDao.findByAccessToken(accessToken);

        if (tokenOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid access token");
        }

        GoogleOAuth2TokenEntity token = tokenOpt.get();

        // Check if token is expired
        if (token.getExpiresAt().before(Timestamp.from(Instant.now()))) {
            throw new IllegalArgumentException("Access token has expired");
        }

        return token;
    }

    @Override
    public TenantId getTenantIdFromToken(String accessToken) {
        GoogleOAuth2TokenEntity token = validateAndGetToken(accessToken);
        return token.toTenantId();
    }

    @Override
    public UserId getUserIdFromToken(String accessToken) {
        GoogleOAuth2TokenEntity token = validateAndGetToken(accessToken);
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
        return configuredClientId.equals(clientId) && configuredClientSecret.equals(clientSecret);
    }

    private String generateSecureToken(int length) {
        byte[] randomBytes = new byte[length];
        SECURE_RANDOM.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }
}
