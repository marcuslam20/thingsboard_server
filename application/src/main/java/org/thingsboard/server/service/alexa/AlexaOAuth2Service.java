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

import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.dao.model.sql.AlexaOAuth2TokenEntity;
import org.thingsboard.server.service.alexa.dto.AlexaOAuth2TokenResponse;

/**
 * Service for managing Alexa Smart Home OAuth2 authorization flow and tokens.
 * Implements OAuth2 Authorization Code Flow as required by Alexa Smart Home.
 */
public interface AlexaOAuth2Service {

    /**
     * Generate an authorization code for OAuth2 flow.
     * Authorization code is valid for 10 minutes.
     *
     * @param tenantId the tenant ID
     * @param userId the user ID
     * @param alexaUserId the Alexa user ID (from Alexa's request)
     * @return the generated authorization code
     */
    String generateAuthorizationCode(TenantId tenantId, UserId userId, String alexaUserId);

    /**
     * Exchange authorization code for access token and refresh token.
     * This is called by Alexa's token endpoint during account linking.
     *
     * @param authCode the authorization code
     * @param clientId the OAuth2 client ID
     * @param clientSecret the OAuth2 client secret
     * @return token response with access_token and refresh_token
     * @throws IllegalArgumentException if code is invalid, expired, or already used
     */
    AlexaOAuth2TokenResponse exchangeCodeForToken(String authCode, String clientId, String clientSecret);

    /**
     * Refresh an expired access token using a refresh token.
     *
     * @param refreshToken the refresh token
     * @param clientId the OAuth2 client ID
     * @param clientSecret the OAuth2 client secret
     * @return token response with new access_token
     * @throws IllegalArgumentException if refresh token is invalid
     */
    AlexaOAuth2TokenResponse refreshAccessToken(String refreshToken, String clientId, String clientSecret);

    /**
     * Revoke access token and refresh token.
     * This is called when user unlinks their account in Alexa app.
     *
     * @param accessToken the access token to revoke
     */
    void revokeToken(String accessToken);

    /**
     * Revoke all tokens for an Alexa user.
     *
     * @param alexaUserId the Alexa user ID
     */
    void revokeTokenByAlexaUserId(String alexaUserId);

    /**
     * Validate an access token and return the associated token entity.
     *
     * @param accessToken the access token to validate
     * @return the token entity if valid
     * @throws IllegalArgumentException if token is invalid or expired
     */
    AlexaOAuth2TokenEntity validateAndGetToken(String accessToken);

    /**
     * Get tenant ID from access token.
     *
     * @param accessToken the access token
     * @return the tenant ID
     * @throws IllegalArgumentException if token is invalid
     */
    TenantId getTenantIdFromToken(String accessToken);

    /**
     * Get user ID from access token.
     *
     * @param accessToken the access token
     * @return the user ID
     * @throws IllegalArgumentException if token is invalid
     */
    UserId getUserIdFromToken(String accessToken);

    /**
     * Clean up expired tokens and authorization codes.
     * Should be called periodically by a scheduled task.
     *
     * @return number of expired items deleted
     */
    int cleanupExpiredTokens();
}
