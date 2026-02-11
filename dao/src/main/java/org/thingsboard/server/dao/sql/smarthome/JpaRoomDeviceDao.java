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
import org.thingsboard.server.common.data.smarthome.RoomDevice;
import org.thingsboard.server.dao.model.sql.RoomDeviceEntity;
import org.thingsboard.server.dao.smarthome.RoomDeviceDao;
import org.thingsboard.server.dao.util.SqlDao;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@SqlDao
@RequiredArgsConstructor
public class JpaRoomDeviceDao implements RoomDeviceDao {

    private final RoomDeviceRepository repository;

    @Override
    public RoomDevice save(RoomDevice roomDevice) {
        RoomDeviceEntity entity = new RoomDeviceEntity(roomDevice);
        return repository.save(entity).toData();
    }

    @Override
    public List<RoomDevice> findByRoomId(UUID roomId) {
        return repository.findByRoomIdOrderBySortOrder(roomId).stream()
                .map(RoomDeviceEntity::toData)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void removeByRoomIdAndDeviceId(UUID roomId, UUID deviceId) {
        repository.deleteByRoomIdAndDeviceId(roomId, deviceId);
    }

    @Override
    @Transactional
    public void removeByRoomId(UUID roomId) {
        repository.deleteByRoomId(roomId);
    }
}
