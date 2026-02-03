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
package org.thingsboard.server.dao.sql.google;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.thingsboard.server.dao.google.GoogleOAuth2AuthCodeDao;
import org.thingsboard.server.dao.model.sql.GoogleOAuth2AuthCodeEntity;
import org.thingsboard.server.dao.util.SqlDao;

import java.sql.Timestamp;
import java.util.Optional;

@Component
@SqlDao
@RequiredArgsConstructor
public class JpaGoogleOAuth2AuthCodeDao implements GoogleOAuth2AuthCodeDao {

    private final GoogleOAuth2AuthCodeRepository repository;

    @Override
    public GoogleOAuth2AuthCodeEntity save(GoogleOAuth2AuthCodeEntity authCode) {
        return repository.save(authCode);
    }

    @Override
    public Optional<GoogleOAuth2AuthCodeEntity> findByCodeAndNotUsed(String code) {
        return repository.findByCodeAndNotUsed(code);
    }

    @Override
    public boolean markAsUsed(String code) {
        return repository.markAsUsed(code) > 0;
    }

    @Override
    public void deleteByCode(String code) {
        repository.deleteByCode(code);
    }

    @Override
    public int deleteExpiredCodes(Timestamp timestamp) {
        return repository.deleteExpiredCodes(timestamp);
    }
}
