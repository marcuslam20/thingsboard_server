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
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.dao.google.GoogleOAuth2TokenDao;
import org.thingsboard.server.dao.model.sql.GoogleOAuth2TokenEntity;
import org.thingsboard.server.dao.util.SqlDao;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Component
@SqlDao
@RequiredArgsConstructor
public class JpaGoogleOAuth2TokenDao implements GoogleOAuth2TokenDao {

    private final GoogleOAuth2TokenRepository repository;

    @Override
    public GoogleOAuth2TokenEntity save(GoogleOAuth2TokenEntity token) {
        return repository.save(token);
    }

    @Override
    public Optional<GoogleOAuth2TokenEntity> findByGoogleUserId(String googleUserId) {
        return repository.findByGoogleUserId(googleUserId);
    }

    @Override
    public Optional<GoogleOAuth2TokenEntity> findByAccessToken(String accessToken) {
        return repository.findByAccessToken(accessToken);
    }

    @Override
    public Optional<GoogleOAuth2TokenEntity> findByRefreshToken(String refreshToken) {
        return repository.findByRefreshToken(refreshToken);
    }

    @Override
    public List<GoogleOAuth2TokenEntity> findByTenantId(TenantId tenantId) {
        return repository.findByTenantId(tenantId.getId());
    }

    @Override
    public List<GoogleOAuth2TokenEntity> findByUserId(UserId userId) {
        return repository.findByUserId(userId.getId());
    }

    @Override
    public List<GoogleOAuth2TokenEntity> findExpiredTokens(Timestamp timestamp) {
        return repository.findExpiredTokens(timestamp);
    }

    @Override
    public void deleteByGoogleUserId(String googleUserId) {
        repository.deleteByGoogleUserId(googleUserId);
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
