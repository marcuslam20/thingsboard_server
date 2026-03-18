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
import org.thingsboard.server.common.data.smarthome.SmartHomeDevice;
import org.thingsboard.server.dao.model.sql.SmartHomeDeviceEntity;
import org.thingsboard.server.dao.smarthome.SmartHomeDeviceDao;
import org.thingsboard.server.dao.util.SqlDao;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@SqlDao
@RequiredArgsConstructor
public class JpaSmartHomeDeviceDao implements SmartHomeDeviceDao {

    private final SmartHomeDeviceRepository repository;

    @Override
    public SmartHomeDevice save(SmartHomeDevice smartHomeDevice) {
        SmartHomeDeviceEntity entity = new SmartHomeDeviceEntity(smartHomeDevice);
        return repository.save(entity).toData();
    }

    @Override
    public List<SmartHomeDevice> findBySmartHomeId(UUID smartHomeId) {
        return repository.findBySmartHomeIdOrderBySortOrder(smartHomeId).stream()
                .map(SmartHomeDeviceEntity::toData)
                .collect(Collectors.toList());
    }

    @Override
    public List<SmartHomeDevice> findBySmartHomeIdAndRoomId(UUID smartHomeId, UUID roomId) {
        return repository.findBySmartHomeIdAndRoomIdOrderBySortOrder(smartHomeId, roomId).stream()
                .map(SmartHomeDeviceEntity::toData)
                .collect(Collectors.toList());
    }

    @Override
    public List<SmartHomeDevice> findBySmartHomeIdUnassigned(UUID smartHomeId) {
        return repository.findBySmartHomeIdAndRoomIdIsNullOrderBySortOrder(smartHomeId).stream()
                .map(SmartHomeDeviceEntity::toData)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<SmartHomeDevice> findByDeviceId(UUID deviceId) {
        return repository.findByDeviceId(deviceId).map(SmartHomeDeviceEntity::toData);
    }

    @Override
    @Transactional
    public void removeBySmartHomeIdAndDeviceId(UUID smartHomeId, UUID deviceId) {
        repository.deleteBySmartHomeIdAndDeviceId(smartHomeId, deviceId);
    }

    @Override
    @Transactional
    public void removeBySmartHomeId(UUID smartHomeId) {
        repository.deleteBySmartHomeId(smartHomeId);
    }

    @Override
    public boolean existsByDeviceId(UUID deviceId) {
        return repository.existsByDeviceId(deviceId);
    }
}
