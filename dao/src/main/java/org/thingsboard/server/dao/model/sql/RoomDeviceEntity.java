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
import org.thingsboard.server.common.data.id.RoomId;
import org.thingsboard.server.common.data.smarthome.RoomDevice;
import org.thingsboard.server.dao.model.ModelConstants;

import java.util.UUID;

@Data
@Entity
@Table(name = ModelConstants.ROOM_DEVICE_TABLE_NAME)
@IdClass(RoomDeviceCompositeId.class)
public class RoomDeviceEntity {

    @Id
    @Column(name = ModelConstants.ROOM_DEVICE_ROOM_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID roomId;

    @Id
    @Column(name = ModelConstants.ROOM_DEVICE_DEVICE_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID deviceId;

    @Column(name = ModelConstants.ROOM_DEVICE_SORT_ORDER_PROPERTY)
    private int sortOrder;

    public RoomDeviceEntity() {}

    public RoomDeviceEntity(RoomDevice roomDevice) {
        this.roomId = roomDevice.getRoomId() != null ? roomDevice.getRoomId().getId() : null;
        this.deviceId = roomDevice.getDeviceId() != null ? roomDevice.getDeviceId().getId() : null;
        this.sortOrder = roomDevice.getSortOrder();
    }

    public RoomDevice toData() {
        RoomDevice roomDevice = new RoomDevice();
        roomDevice.setRoomId(new RoomId(roomId));
        roomDevice.setDeviceId(new DeviceId(deviceId));
        roomDevice.setSortOrder(sortOrder);
        return roomDevice;
    }
}
