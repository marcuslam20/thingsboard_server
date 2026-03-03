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
import org.thingsboard.server.common.data.smarthome.DeviceGroupMember;
import org.thingsboard.server.dao.model.sql.DeviceGroupMemberEntity;
import org.thingsboard.server.dao.smarthome.DeviceGroupMemberDao;
import org.thingsboard.server.dao.util.SqlDao;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@SqlDao
@RequiredArgsConstructor
public class JpaDeviceGroupMemberDao implements DeviceGroupMemberDao {

    private final DeviceGroupMemberRepository repository;

    @Override
    public DeviceGroupMember save(DeviceGroupMember member) {
        DeviceGroupMemberEntity entity = new DeviceGroupMemberEntity(member);
        return repository.save(entity).toData();
    }

    @Override
    public List<DeviceGroupMember> findByGroupId(UUID groupId) {
        return repository.findByGroupId(groupId).stream()
                .map(DeviceGroupMemberEntity::toData)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void removeByGroupIdAndDeviceId(UUID groupId, UUID deviceId) {
        repository.deleteByGroupIdAndDeviceId(groupId, deviceId);
    }

    @Override
    @Transactional
    public void removeByGroupId(UUID groupId) {
        repository.deleteByGroupId(groupId);
    }
}
