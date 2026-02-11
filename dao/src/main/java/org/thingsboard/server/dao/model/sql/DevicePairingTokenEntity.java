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
import lombok.Data;
import org.thingsboard.server.common.data.id.DeviceId;
import org.thingsboard.server.common.data.id.DeviceProfileId;
import org.thingsboard.server.common.data.id.RoomId;
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.smarthome.DevicePairingStatus;
import org.thingsboard.server.common.data.smarthome.DevicePairingToken;
import org.thingsboard.server.dao.model.ModelConstants;
import org.thingsboard.server.dao.util.mapping.JsonConverter;

import java.util.UUID;

@Data
@Entity
@Table(name = ModelConstants.DEVICE_PAIRING_TOKEN_TABLE_NAME)
public class DevicePairingTokenEntity {

    @Id
    @Column(name = ModelConstants.ID_PROPERTY, columnDefinition = "uuid")
    private UUID id;

    @Column(name = ModelConstants.CREATED_TIME_PROPERTY, updatable = false)
    private long createdTime;

    @Column(name = ModelConstants.TENANT_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    @Column(name = ModelConstants.DEVICE_PAIRING_TOKEN_DEVICE_PROFILE_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID deviceProfileId;

    @Column(name = ModelConstants.DEVICE_PAIRING_TOKEN_SMART_HOME_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID smartHomeId;

    @Column(name = ModelConstants.DEVICE_PAIRING_TOKEN_ROOM_ID_PROPERTY, columnDefinition = "uuid")
    private UUID roomId;

    @Column(name = ModelConstants.DEVICE_PAIRING_TOKEN_TOKEN_PROPERTY, nullable = false, unique = true)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(name = ModelConstants.DEVICE_PAIRING_TOKEN_STATUS_PROPERTY)
    private DevicePairingStatus status;

    @Column(name = ModelConstants.DEVICE_PAIRING_TOKEN_DEVICE_ID_PROPERTY, columnDefinition = "uuid")
    private UUID deviceId;

    @Column(name = ModelConstants.DEVICE_PAIRING_TOKEN_EXPIRES_AT_PROPERTY, nullable = false)
    private long expiresAt;

    @Convert(converter = JsonConverter.class)
    @Column(name = ModelConstants.DEVICE_PAIRING_TOKEN_PAIRING_DATA_PROPERTY, columnDefinition = "jsonb")
    private JsonNode pairingData;

    public DevicePairingTokenEntity() {}

    public DevicePairingTokenEntity(DevicePairingToken token) {
        this.id = token.getId();
        this.createdTime = token.getCreatedTime();
        this.tenantId = token.getTenantId() != null ? token.getTenantId().getId() : null;
        this.deviceProfileId = token.getDeviceProfileId() != null ? token.getDeviceProfileId().getId() : null;
        this.smartHomeId = token.getSmartHomeId() != null ? token.getSmartHomeId().getId() : null;
        this.roomId = token.getRoomId() != null ? token.getRoomId().getId() : null;
        this.token = token.getToken();
        this.status = token.getStatus();
        this.deviceId = token.getDeviceId() != null ? token.getDeviceId().getId() : null;
        this.expiresAt = token.getExpiresAt();
        this.pairingData = token.getPairingData();
    }

    public DevicePairingToken toData() {
        DevicePairingToken data = new DevicePairingToken();
        data.setId(id);
        data.setCreatedTime(createdTime);
        data.setTenantId(TenantId.fromUUID(tenantId));
        data.setDeviceProfileId(new DeviceProfileId(deviceProfileId));
        data.setSmartHomeId(new SmartHomeId(smartHomeId));
        data.setRoomId(roomId != null ? new RoomId(roomId) : null);
        data.setToken(token);
        data.setStatus(status);
        data.setDeviceId(deviceId != null ? new DeviceId(deviceId) : null);
        data.setExpiresAt(expiresAt);
        data.setPairingData(pairingData);
        return data;
    }
}
