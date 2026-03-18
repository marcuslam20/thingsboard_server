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
import jakarta.persistence.Table;
import lombok.Data;
import org.thingsboard.server.common.data.id.DeviceId;
import org.thingsboard.server.common.data.id.RoomId;
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.smarthome.SmartHomeDevice;
import org.thingsboard.server.dao.model.ModelConstants;

import java.util.UUID;

@Data
@Entity
@Table(name = ModelConstants.SMART_HOME_DEVICE_TABLE_NAME)
public class SmartHomeDeviceEntity {

    @Id
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    private UUID id;

    @Column(name = "created_time", nullable = false)
    private long createdTime;

    @Column(name = ModelConstants.SMART_HOME_DEVICE_SMART_HOME_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID smartHomeId;

    @Column(name = ModelConstants.SMART_HOME_DEVICE_DEVICE_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID deviceId;

    @Column(name = ModelConstants.SMART_HOME_DEVICE_ROOM_ID_PROPERTY, columnDefinition = "uuid")
    private UUID roomId;

    @Column(name = ModelConstants.SMART_HOME_DEVICE_DEVICE_NAME_PROPERTY)
    private String deviceName;

    @Column(name = ModelConstants.SMART_HOME_DEVICE_SORT_ORDER_PROPERTY)
    private int sortOrder;

    public SmartHomeDeviceEntity() {}

    public SmartHomeDeviceEntity(SmartHomeDevice data) {
        this.id = data.getId();
        this.createdTime = data.getCreatedTime();
        this.smartHomeId = data.getSmartHomeId() != null ? data.getSmartHomeId().getId() : null;
        this.deviceId = data.getDeviceId() != null ? data.getDeviceId().getId() : null;
        this.roomId = data.getRoomId() != null ? data.getRoomId().getId() : null;
        this.deviceName = data.getDeviceName();
        this.sortOrder = data.getSortOrder();
    }

    public SmartHomeDevice toData() {
        SmartHomeDevice data = new SmartHomeDevice();
        data.setId(id);
        data.setCreatedTime(createdTime);
        data.setSmartHomeId(new SmartHomeId(smartHomeId));
        data.setDeviceId(new DeviceId(deviceId));
        data.setRoomId(roomId != null ? new RoomId(roomId) : null);
        data.setDeviceName(deviceName);
        data.setSortOrder(sortOrder);
        return data;
    }
}
