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
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.smarthome.DeviceGroup;
import org.thingsboard.server.common.data.smarthome.DeviceGroupMember;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class DeviceGroupServiceImpl implements DeviceGroupService {

    private final DeviceGroupDao deviceGroupDao;
    private final DeviceGroupMemberDao deviceGroupMemberDao;

    @Override
    public DeviceGroup createGroup(DeviceGroup group) {
        log.trace("Executing createGroup [{}]", group);
        return deviceGroupDao.save(group);
    }

    @Override
    public Optional<DeviceGroup> findById(UUID groupId) {
        log.trace("Executing findById [{}]", groupId);
        return deviceGroupDao.findById(groupId);
    }

    @Override
    public List<DeviceGroup> findBySmartHomeId(SmartHomeId smartHomeId) {
        log.trace("Executing findBySmartHomeId [{}]", smartHomeId);
        return deviceGroupDao.findBySmartHomeId(smartHomeId.getId());
    }

    @Override
    public void deleteGroup(UUID groupId) {
        log.trace("Executing deleteGroup [{}]", groupId);
        deviceGroupMemberDao.removeByGroupId(groupId);
        deviceGroupDao.removeById(groupId);
    }

    @Override
    public DeviceGroupMember addDevice(UUID groupId, DeviceId deviceId) {
        log.trace("Executing addDevice [groupId={}, deviceId={}]", groupId, deviceId);
        DeviceGroupMember member = new DeviceGroupMember();
        member.setGroupId(groupId);
        member.setDeviceId(deviceId);
        return deviceGroupMemberDao.save(member);
    }

    @Override
    public void removeDevice(UUID groupId, DeviceId deviceId) {
        log.trace("Executing removeDevice [groupId={}, deviceId={}]", groupId, deviceId);
        deviceGroupMemberDao.removeByGroupIdAndDeviceId(groupId, deviceId.getId());
    }

    @Override
    public List<DeviceGroupMember> findDevices(UUID groupId) {
        log.trace("Executing findDevices [{}]", groupId);
        return deviceGroupMemberDao.findByGroupId(groupId);
    }
}
