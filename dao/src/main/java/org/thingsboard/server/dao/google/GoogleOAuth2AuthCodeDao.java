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
package org.thingsboard.server.dao.google;

import org.thingsboard.server.dao.model.sql.GoogleOAuth2AuthCodeEntity;

import java.sql.Timestamp;
import java.util.Optional;

public interface GoogleOAuth2AuthCodeDao {

    /**
     * Save authorization code
     *
     * @param authCode the authorization code entity
     * @return saved authorization code entity
     */
    GoogleOAuth2AuthCodeEntity save(GoogleOAuth2AuthCodeEntity authCode);

    /**
     * Find authorization code that has not been used
     *
     * @param code the authorization code
     * @return the authorization code entity if found and not used
     */
    Optional<GoogleOAuth2AuthCodeEntity> findByCodeAndNotUsed(String code);

    /**
     * Mark authorization code as used
     *
     * @param code the authorization code
     * @return true if code was marked as used
     */
    boolean markAsUsed(String code);

    /**
     * Delete authorization code
     *
     * @param code the authorization code
     */
    void deleteByCode(String code);

    /**
     * Delete all expired authorization codes
     *
     * @param timestamp the current timestamp
     * @return number of deleted codes
     */
    int deleteExpiredCodes(Timestamp timestamp);
}
