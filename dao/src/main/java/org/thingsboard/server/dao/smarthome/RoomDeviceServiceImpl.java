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
import org.thingsboard.server.common.data.id.DeviceId;
import org.thingsboard.server.common.data.id.RoomId;
import org.thingsboard.server.common.data.smarthome.RoomDevice;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class RoomDeviceServiceImpl implements RoomDeviceService {

    private final RoomDeviceDao roomDeviceDao;

    @Override
    public RoomDevice addDeviceToRoom(RoomDevice roomDevice) {
        log.trace("Executing addDeviceToRoom [{}]", roomDevice);
        return roomDeviceDao.save(roomDevice);
    }

    @Override
    public List<RoomDevice> findDevicesByRoomId(RoomId roomId) {
        log.trace("Executing findDevicesByRoomId [{}]", roomId);
        return roomDeviceDao.findByRoomId(roomId.getId());
    }

    @Override
    public void removeDeviceFromRoom(RoomId roomId, DeviceId deviceId) {
        log.trace("Executing removeDeviceFromRoom [{}, {}]", roomId, deviceId);
        roomDeviceDao.removeByRoomIdAndDeviceId(roomId.getId(), deviceId.getId());
    }

    @Override
    public void removeAllFromRoom(RoomId roomId) {
        log.trace("Executing removeAllFromRoom [{}]", roomId);
        roomDeviceDao.removeByRoomId(roomId.getId());
    }
}
