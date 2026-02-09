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
package org.thingsboard.server.dao.alexa;

import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.dao.model.sql.AlexaOAuth2TokenEntity;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

public interface AlexaOAuth2TokenDao {

    /**
     * Save or update Alexa OAuth2 token
     *
     * @param token the token entity
     * @return saved token entity
     */
    AlexaOAuth2TokenEntity save(AlexaOAuth2TokenEntity token);

    /**
     * Find token by Alexa user ID
     *
     * @param alexaUserId the Alexa user ID
     * @return the token entity if found
     */
    Optional<AlexaOAuth2TokenEntity> findByAlexaUserId(String alexaUserId);

    /**
     * Find token by access token
     *
     * @param accessToken the access token
     * @return the token entity if found
     */
    Optional<AlexaOAuth2TokenEntity> findByAccessToken(String accessToken);

    /**
     * Find token by refresh token
     *
     * @param refreshToken the refresh token
     * @return the token entity if found
     */
    Optional<AlexaOAuth2TokenEntity> findByRefreshToken(String refreshToken);

    /**
     * Find all tokens for a tenant
     *
     * @param tenantId the tenant ID
     * @return list of token entities
     */
    List<AlexaOAuth2TokenEntity> findByTenantId(TenantId tenantId);

    /**
     * Find all tokens for a user
     *
     * @param userId the user ID
     * @return list of token entities
     */
    List<AlexaOAuth2TokenEntity> findByUserId(UserId userId);

    /**
     * Find all expired tokens
     *
     * @param timestamp the current timestamp
     * @return list of expired token entities
     */
    List<AlexaOAuth2TokenEntity> findExpiredTokens(Timestamp timestamp);

    /**
     * Delete token by Alexa user ID
     *
     * @param alexaUserId the Alexa user ID
     */
    void deleteByAlexaUserId(String alexaUserId);

    /**
     * Delete token by access token
     *
     * @param accessToken the access token
     */
    void deleteByAccessToken(String accessToken);

    /**
     * Delete all tokens for a tenant
     *
     * @param tenantId the tenant ID
     */
    void deleteByTenantId(TenantId tenantId);

    /**
     * Delete all tokens for a user
     *
     * @param userId the user ID
     */
    void deleteByUserId(UserId userId);

    /**
     * Delete all expired tokens
     *
     * @param timestamp the current timestamp
     * @return number of deleted tokens
     */
    int deleteExpiredTokens(Timestamp timestamp);
}
