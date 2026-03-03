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
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Data;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLJsonPGObjectJsonbType;
import org.thingsboard.server.common.data.id.DeviceId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.common.data.smarthome.DeviceShare;
import org.thingsboard.server.common.data.smarthome.DeviceShareStatus;
import org.thingsboard.server.dao.model.ModelConstants;
import org.thingsboard.server.dao.util.mapping.JsonConverter;

import java.util.UUID;

@Data
@Entity
@Table(name = ModelConstants.DEVICE_SHARE_TABLE_NAME)
public class DeviceShareEntity {

    @Id
    @Column(name = ModelConstants.ID_PROPERTY, columnDefinition = "uuid")
    private UUID id;

    @Column(name = ModelConstants.CREATED_TIME_PROPERTY, updatable = false)
    private long createdTime;

    @Column(name = ModelConstants.TENANT_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    @Column(name = ModelConstants.DEVICE_SHARE_DEVICE_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID deviceId;

    @Column(name = ModelConstants.DEVICE_SHARE_SHARED_BY_USER_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID sharedByUserId;

    @Column(name = ModelConstants.DEVICE_SHARE_SHARED_TO_USER_ID_PROPERTY, columnDefinition = "uuid")
    private UUID sharedToUserId;

    @Column(name = ModelConstants.DEVICE_SHARE_SHARE_CODE_PROPERTY, unique = true)
    private String shareCode;

    @Convert(converter = JsonConverter.class)
    @JdbcType(PostgreSQLJsonPGObjectJsonbType.class)
    @Column(name = ModelConstants.DEVICE_SHARE_PERMISSIONS_PROPERTY, columnDefinition = "jsonb")
    private JsonNode permissions;

    @Enumerated(EnumType.STRING)
    @Column(name = ModelConstants.DEVICE_SHARE_STATUS_PROPERTY)
    private DeviceShareStatus status;

    @Column(name = ModelConstants.DEVICE_SHARE_EXPIRES_AT_PROPERTY)
    private long expiresAt;

    @Version
    @Column(name = ModelConstants.VERSION_PROPERTY)
    private Long version;

    public DeviceShareEntity() {}

    public DeviceShareEntity(DeviceShare share) {
        this.id = share.getId();
        this.createdTime = share.getCreatedTime();
        this.tenantId = share.getTenantId() != null ? share.getTenantId().getId() : null;
        this.deviceId = share.getDeviceId() != null ? share.getDeviceId().getId() : null;
        this.sharedByUserId = share.getSharedByUserId() != null ? share.getSharedByUserId().getId() : null;
        this.sharedToUserId = share.getSharedToUserId() != null ? share.getSharedToUserId().getId() : null;
        this.shareCode = share.getShareCode();
        this.permissions = share.getPermissions();
        this.status = share.getStatus();
        this.expiresAt = share.getExpiresAt();
        this.version = share.getVersion();
    }

    public DeviceShare toData() {
        DeviceShare data = new DeviceShare();
        data.setId(id);
        data.setCreatedTime(createdTime);
        data.setTenantId(TenantId.fromUUID(tenantId));
        data.setDeviceId(new DeviceId(deviceId));
        data.setSharedByUserId(new UserId(sharedByUserId));
        data.setSharedToUserId(sharedToUserId != null ? new UserId(sharedToUserId) : null);
        data.setShareCode(shareCode);
        data.setPermissions(permissions);
        data.setStatus(status);
        data.setExpiresAt(expiresAt);
        data.setVersion(version);
        return data;
    }
}
