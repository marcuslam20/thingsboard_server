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
package org.thingsboard.server.dao.sql.alexa;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.thingsboard.server.dao.model.sql.AlexaOAuth2TokenEntity;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AlexaOAuth2TokenRepository extends JpaRepository<AlexaOAuth2TokenEntity, UUID> {

    @Query("SELECT t FROM AlexaOAuth2TokenEntity t WHERE t.alexaUserId = :alexaUserId")
    Optional<AlexaOAuth2TokenEntity> findByAlexaUserId(@Param("alexaUserId") String alexaUserId);

    @Query("SELECT t FROM AlexaOAuth2TokenEntity t WHERE t.accessToken = :accessToken")
    Optional<AlexaOAuth2TokenEntity> findByAccessToken(@Param("accessToken") String accessToken);

    @Query("SELECT t FROM AlexaOAuth2TokenEntity t WHERE t.refreshToken = :refreshToken")
    Optional<AlexaOAuth2TokenEntity> findByRefreshToken(@Param("refreshToken") String refreshToken);

    @Query("SELECT t FROM AlexaOAuth2TokenEntity t WHERE t.tenantId = :tenantId")
    List<AlexaOAuth2TokenEntity> findByTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT t FROM AlexaOAuth2TokenEntity t WHERE t.userId = :userId")
    List<AlexaOAuth2TokenEntity> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT t FROM AlexaOAuth2TokenEntity t WHERE t.expiresAt < :timestamp")
    List<AlexaOAuth2TokenEntity> findExpiredTokens(@Param("timestamp") Timestamp timestamp);

    @Transactional
    @Modifying
    @Query("DELETE FROM AlexaOAuth2TokenEntity t WHERE t.alexaUserId = :alexaUserId")
    void deleteByAlexaUserId(@Param("alexaUserId") String alexaUserId);

    @Transactional
    @Modifying
    @Query("DELETE FROM AlexaOAuth2TokenEntity t WHERE t.accessToken = :accessToken")
    void deleteByAccessToken(@Param("accessToken") String accessToken);

    @Transactional
    @Modifying
    @Query("DELETE FROM AlexaOAuth2TokenEntity t WHERE t.tenantId = :tenantId")
    void deleteByTenantId(@Param("tenantId") UUID tenantId);

    @Transactional
    @Modifying
    @Query("DELETE FROM AlexaOAuth2TokenEntity t WHERE t.userId = :userId")
    void deleteByUserId(@Param("userId") UUID userId);

    @Transactional
    @Modifying
    @Query("DELETE FROM AlexaOAuth2TokenEntity t WHERE t.expiresAt < :timestamp")
    int deleteExpiredTokens(@Param("timestamp") Timestamp timestamp);
}
