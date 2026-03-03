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
package org.thingsboard.server.dao.smarthome;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thingsboard.server.common.data.EntityType;
import org.thingsboard.server.common.data.id.EntityId;
import org.thingsboard.server.common.data.id.HasId;
import org.thingsboard.server.common.data.id.RoomId;
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.smarthome.Room;
import org.thingsboard.server.dao.entity.AbstractEntityService;

import java.util.List;
import java.util.Optional;

import static org.thingsboard.server.dao.service.Validator.validateId;

@Service("RoomDaoService")
@Slf4j
@RequiredArgsConstructor
public class RoomServiceImpl extends AbstractEntityService implements RoomService {

    private static final String INCORRECT_ROOM_ID = "Incorrect roomId ";

    private final RoomDao roomDao;

    @Override
    public Room findRoomById(TenantId tenantId, RoomId roomId) {
        log.trace("Executing findRoomById [{}]", roomId);
        validateId(roomId, id -> INCORRECT_ROOM_ID + id);
        return roomDao.findById(tenantId, roomId.getId());
    }

    @Override
    public Room saveRoom(Room room) {
        log.trace("Executing saveRoom [{}]", room);
        return roomDao.save(room.getTenantId(), room);
    }

    @Override
    public List<Room> findRoomsBySmartHomeId(SmartHomeId smartHomeId) {
        log.trace("Executing findRoomsBySmartHomeId [{}]", smartHomeId);
        return roomDao.findBySmartHomeId(smartHomeId.getId());
    }

    @Override
    @Transactional
    public void deleteRoom(TenantId tenantId, RoomId roomId) {
        log.trace("Executing deleteRoom [{}]", roomId);
        validateId(roomId, id -> INCORRECT_ROOM_ID + id);
        roomDao.removeById(tenantId, roomId.getId());
    }

    @Override
    @Transactional
    public void deleteRoomsBySmartHomeId(SmartHomeId smartHomeId) {
        log.trace("Executing deleteRoomsBySmartHomeId [{}]", smartHomeId);
        roomDao.removeBySmartHomeId(smartHomeId.getId());
    }

    @Override
    public Optional<HasId<?>> findEntity(TenantId tenantId, EntityId entityId) {
        return Optional.ofNullable(findRoomById(tenantId, new RoomId(entityId.getId())));
    }

    @Override
    public EntityType getEntityType() {
        return EntityType.ROOM;
    }
}
