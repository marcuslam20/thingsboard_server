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

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.thingsboard.server.dao.alexa.AlexaOAuth2AuthCodeDao;
import org.thingsboard.server.dao.model.sql.AlexaOAuth2AuthCodeEntity;
import org.thingsboard.server.dao.util.SqlDao;

import java.sql.Timestamp;
import java.util.Optional;

@Component
@SqlDao
@RequiredArgsConstructor
public class JpaAlexaOAuth2AuthCodeDao implements AlexaOAuth2AuthCodeDao {

    private final AlexaOAuth2AuthCodeRepository repository;

    @Override
    public AlexaOAuth2AuthCodeEntity save(AlexaOAuth2AuthCodeEntity authCode) {
        return repository.save(authCode);
    }

    @Override
    public Optional<AlexaOAuth2AuthCodeEntity> findByCodeAndNotUsed(String code) {
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
