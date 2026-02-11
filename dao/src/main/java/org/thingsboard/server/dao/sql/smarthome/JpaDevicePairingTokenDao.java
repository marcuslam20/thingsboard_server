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
package org.thingsboard.server.dao.sql.smarthome;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.thingsboard.server.common.data.smarthome.DevicePairingStatus;
import org.thingsboard.server.common.data.smarthome.DevicePairingToken;
import org.thingsboard.server.dao.model.sql.DevicePairingTokenEntity;
import org.thingsboard.server.dao.smarthome.DevicePairingTokenDao;
import org.thingsboard.server.dao.util.SqlDao;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@SqlDao
@RequiredArgsConstructor
public class JpaDevicePairingTokenDao implements DevicePairingTokenDao {

    private final DevicePairingTokenRepository repository;

    @Override
    public DevicePairingToken save(DevicePairingToken token) {
        DevicePairingTokenEntity entity = new DevicePairingTokenEntity(token);
        if (entity.getId() == null) {
            entity.setId(UUID.randomUUID());
            entity.setCreatedTime(System.currentTimeMillis());
        }
        return repository.save(entity).toData();
    }

    @Override
    public Optional<DevicePairingToken> findById(UUID id) {
        return repository.findById(id).map(DevicePairingTokenEntity::toData);
    }

    @Override
    public Optional<DevicePairingToken> findByToken(String token) {
        return repository.findByToken(token).map(DevicePairingTokenEntity::toData);
    }

    @Override
    public List<DevicePairingToken> findBySmartHomeIdAndStatus(UUID smartHomeId, DevicePairingStatus status) {
        return repository.findBySmartHomeIdAndStatus(smartHomeId, status).stream()
                .map(DevicePairingTokenEntity::toData)
                .collect(Collectors.toList());
    }

    @Override
    public List<DevicePairingToken> findByTenantId(UUID tenantId) {
        return repository.findByTenantId(tenantId).stream()
                .map(DevicePairingTokenEntity::toData)
                .collect(Collectors.toList());
    }

    @Override
    public List<DevicePairingToken> findExpiredPending(long now) {
        return repository.findByStatusAndExpiresAtLessThan(DevicePairingStatus.PENDING, now).stream()
                .map(DevicePairingTokenEntity::toData)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void removeById(UUID id) {
        repository.deleteById(id);
    }
}
