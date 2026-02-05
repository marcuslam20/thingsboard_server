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
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.dao.alexa.AlexaOAuth2TokenDao;
import org.thingsboard.server.dao.model.sql.AlexaOAuth2TokenEntity;
import org.thingsboard.server.dao.util.SqlDao;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Component
@SqlDao
@RequiredArgsConstructor
public class JpaAlexaOAuth2TokenDao implements AlexaOAuth2TokenDao {

    private final AlexaOAuth2TokenRepository repository;

    @Override
    public AlexaOAuth2TokenEntity save(AlexaOAuth2TokenEntity token) {
        return repository.save(token);
    }

    @Override
    public Optional<AlexaOAuth2TokenEntity> findByAlexaUserId(String alexaUserId) {
        return repository.findByAlexaUserId(alexaUserId);
    }

    @Override
    public Optional<AlexaOAuth2TokenEntity> findByAccessToken(String accessToken) {
        return repository.findByAccessToken(accessToken);
    }

    @Override
    public Optional<AlexaOAuth2TokenEntity> findByRefreshToken(String refreshToken) {
        return repository.findByRefreshToken(refreshToken);
    }

    @Override
    public List<AlexaOAuth2TokenEntity> findByTenantId(TenantId tenantId) {
        return repository.findByTenantId(tenantId.getId());
    }

    @Override
    public List<AlexaOAuth2TokenEntity> findByUserId(UserId userId) {
        return repository.findByUserId(userId.getId());
    }

    @Override
    public List<AlexaOAuth2TokenEntity> findExpiredTokens(Timestamp timestamp) {
        return repository.findExpiredTokens(timestamp);
    }

    @Override
    public void deleteByAlexaUserId(String alexaUserId) {
        repository.deleteByAlexaUserId(alexaUserId);
    }

    @Override
    public void deleteByAccessToken(String accessToken) {
        repository.deleteByAccessToken(accessToken);
    }

    @Override
    public void deleteByTenantId(TenantId tenantId) {
        repository.deleteByTenantId(tenantId.getId());
    }

    @Override
    public void deleteByUserId(UserId userId) {
        repository.deleteByUserId(userId.getId());
    }

    @Override
    public int deleteExpiredTokens(Timestamp timestamp) {
        return repository.deleteExpiredTokens(timestamp);
    }
}
