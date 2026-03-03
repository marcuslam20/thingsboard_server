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
package org.thingsboard.server.dao.model.sql;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.Data;
import org.thingsboard.server.common.data.id.DeviceId;
import org.thingsboard.server.common.data.smarthome.DeviceGroupMember;
import org.thingsboard.server.dao.model.ModelConstants;

import java.util.UUID;

@Data
@Entity
@Table(name = ModelConstants.DEVICE_GROUP_MEMBER_TABLE_NAME)
@IdClass(DeviceGroupMemberCompositeId.class)
public class DeviceGroupMemberEntity {

    @Id
    @Column(name = ModelConstants.DEVICE_GROUP_MEMBER_GROUP_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID groupId;

    @Id
    @Column(name = ModelConstants.DEVICE_GROUP_MEMBER_DEVICE_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID deviceId;

    public DeviceGroupMemberEntity() {}

    public DeviceGroupMemberEntity(DeviceGroupMember member) {
        this.groupId = member.getGroupId();
        this.deviceId = member.getDeviceId() != null ? member.getDeviceId().getId() : null;
    }

    public DeviceGroupMember toData() {
        DeviceGroupMember data = new DeviceGroupMember();
        data.setGroupId(groupId);
        data.setDeviceId(new DeviceId(deviceId));
        return data;
    }
}
