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

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Data;
import org.thingsboard.server.common.data.id.DeviceProfileId;
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.smarthome.DeviceGroup;
import org.thingsboard.server.dao.model.ModelConstants;
import org.thingsboard.server.dao.util.mapping.JsonConverter;

import java.util.UUID;

@Data
@Entity
@Table(name = ModelConstants.DEVICE_GROUP_TABLE_NAME)
public class DeviceGroupEntity {

    @Id
    @Column(name = ModelConstants.ID_PROPERTY, columnDefinition = "uuid")
    private UUID id;

    @Column(name = ModelConstants.CREATED_TIME_PROPERTY, updatable = false)
    private long createdTime;

    @Column(name = ModelConstants.TENANT_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    @Column(name = ModelConstants.DEVICE_GROUP_SMART_HOME_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID smartHomeId;

    @Column(name = ModelConstants.NAME_PROPERTY, nullable = false)
    private String name;

    @Column(name = ModelConstants.DEVICE_GROUP_DEVICE_PROFILE_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID deviceProfileId;

    @Column(name = ModelConstants.DEVICE_GROUP_ICON_PROPERTY)
    private String icon;

    @Convert(converter = JsonConverter.class)
    @Column(name = ModelConstants.ADDITIONAL_INFO_PROPERTY, columnDefinition = "varchar")
    private JsonNode additionalInfo;

    @Version
    @Column(name = ModelConstants.VERSION_PROPERTY)
    private Long version;

    public DeviceGroupEntity() {}

    public DeviceGroupEntity(DeviceGroup group) {
        this.id = group.getId();
        this.createdTime = group.getCreatedTime();
        this.tenantId = group.getTenantId() != null ? group.getTenantId().getId() : null;
        this.smartHomeId = group.getSmartHomeId() != null ? group.getSmartHomeId().getId() : null;
        this.name = group.getName();
        this.deviceProfileId = group.getDeviceProfileId() != null ? group.getDeviceProfileId().getId() : null;
        this.icon = group.getIcon();
        this.additionalInfo = group.getAdditionalInfo();
        this.version = group.getVersion();
    }

    public DeviceGroup toData() {
        DeviceGroup data = new DeviceGroup();
        data.setId(id);
        data.setCreatedTime(createdTime);
        data.setTenantId(TenantId.fromUUID(tenantId));
        data.setSmartHomeId(new SmartHomeId(smartHomeId));
        data.setName(name);
        data.setDeviceProfileId(new DeviceProfileId(deviceProfileId));
        data.setIcon(icon);
        data.setAdditionalInfo(additionalInfo);
        data.setVersion(version);
        return data;
    }
}
