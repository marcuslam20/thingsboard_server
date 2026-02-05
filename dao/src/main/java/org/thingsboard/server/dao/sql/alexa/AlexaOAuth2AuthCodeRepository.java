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
import org.thingsboard.server.dao.model.sql.AlexaOAuth2AuthCodeEntity;

import java.sql.Timestamp;
import java.util.Optional;

public interface AlexaOAuth2AuthCodeRepository extends JpaRepository<AlexaOAuth2AuthCodeEntity, String> {

    @Query("SELECT c FROM AlexaOAuth2AuthCodeEntity c WHERE c.code = :code AND c.used = false")
    Optional<AlexaOAuth2AuthCodeEntity> findByCodeAndNotUsed(@Param("code") String code);

    @Transactional
    @Modifying
    @Query("UPDATE AlexaOAuth2AuthCodeEntity c SET c.used = true WHERE c.code = :code")
    int markAsUsed(@Param("code") String code);

    @Transactional
    @Modifying
    @Query("DELETE FROM AlexaOAuth2AuthCodeEntity c WHERE c.expiresAt < :timestamp")
    int deleteExpiredCodes(@Param("timestamp") Timestamp timestamp);

    @Transactional
    @Modifying
    @Query("DELETE FROM AlexaOAuth2AuthCodeEntity c WHERE c.code = :code")
    void deleteByCode(@Param("code") String code);
}
