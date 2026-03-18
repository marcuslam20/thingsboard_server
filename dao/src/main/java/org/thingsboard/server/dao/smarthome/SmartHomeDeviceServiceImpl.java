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
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.smarthome.SmartHomeDevice;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class SmartHomeDeviceServiceImpl implements SmartHomeDeviceService {

    private final SmartHomeDeviceDao smartHomeDeviceDao;

    @Override
    public SmartHomeDevice addDeviceToHome(SmartHomeDevice smartHomeDevice) {
        log.trace("Executing addDeviceToHome [{}]", smartHomeDevice);
        if (smartHomeDevice.getId() == null) {
            smartHomeDevice.setId(UUID.randomUUID());
        }
        if (smartHomeDevice.getCreatedTime() == 0) {
            smartHomeDevice.setCreatedTime(System.currentTimeMillis());
        }
        return smartHomeDeviceDao.save(smartHomeDevice);
    }

    @Override
    public SmartHomeDevice updateDevice(SmartHomeDevice smartHomeDevice) {
        log.trace("Executing updateDevice [{}]", smartHomeDevice);
        return smartHomeDeviceDao.save(smartHomeDevice);
    }

    @Override
    public List<SmartHomeDevice> findDevicesByHomeId(SmartHomeId homeId) {
        log.trace("Executing findDevicesByHomeId [{}]", homeId);
        return smartHomeDeviceDao.findBySmartHomeId(homeId.getId());
    }

    @Override
    public List<SmartHomeDevice> findDevicesByHomeIdAndRoomId(SmartHomeId homeId, RoomId roomId) {
        log.trace("Executing findDevicesByHomeIdAndRoomId [{}, {}]", homeId, roomId);
        return smartHomeDeviceDao.findBySmartHomeIdAndRoomId(homeId.getId(), roomId.getId());
    }

    @Override
    public List<SmartHomeDevice> findUnassignedDevices(SmartHomeId homeId) {
        log.trace("Executing findUnassignedDevices [{}]", homeId);
        return smartHomeDeviceDao.findBySmartHomeIdUnassigned(homeId.getId());
    }

    @Override
    public Optional<SmartHomeDevice> findByDeviceId(DeviceId deviceId) {
        log.trace("Executing findByDeviceId [{}]", deviceId);
        return smartHomeDeviceDao.findByDeviceId(deviceId.getId());
    }

    @Override
    public void removeDeviceFromHome(SmartHomeId homeId, DeviceId deviceId) {
        log.trace("Executing removeDeviceFromHome [{}, {}]", homeId, deviceId);
        smartHomeDeviceDao.removeBySmartHomeIdAndDeviceId(homeId.getId(), deviceId.getId());
    }

    @Override
    public void removeAllDevicesFromHome(SmartHomeId homeId) {
        log.trace("Executing removeAllDevicesFromHome [{}]", homeId);
        smartHomeDeviceDao.removeBySmartHomeId(homeId.getId());
    }

    @Override
    public boolean isDeviceInAnyHome(DeviceId deviceId) {
        return smartHomeDeviceDao.existsByDeviceId(deviceId.getId());
    }
}
