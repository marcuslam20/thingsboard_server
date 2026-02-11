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
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.thingsboard.server.common.data.id.RoomId;
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.smarthome.Room;
import org.thingsboard.server.dao.model.BaseVersionedEntity;
import org.thingsboard.server.dao.model.ModelConstants;

import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = ModelConstants.ROOM_TABLE_NAME)
public class RoomEntity extends BaseVersionedEntity<Room> {

    @Column(name = ModelConstants.TENANT_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    @Column(name = ModelConstants.ROOM_SMART_HOME_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID smartHomeId;

    @Column(name = ModelConstants.NAME_PROPERTY, nullable = false)
    private String name;

    @Column(name = ModelConstants.ROOM_ICON_PROPERTY)
    private String icon;

    @Column(name = ModelConstants.ROOM_SORT_ORDER_PROPERTY)
    private int sortOrder;

    @Column(name = ModelConstants.ADDITIONAL_INFO_PROPERTY)
    private String additionalInfo;

    public RoomEntity() {
        super();
    }

    public RoomEntity(Room room) {
        super(room);
        this.tenantId = getTenantUuid(room.getTenantId());
        this.smartHomeId = getUuid(room.getSmartHomeId());
        this.name = room.getName();
        this.icon = room.getIcon();
        this.sortOrder = room.getSortOrder();
        this.additionalInfo = room.getAdditionalInfo();
    }

    @Override
    public Room toData() {
        Room room = new Room(new RoomId(id));
        room.setCreatedTime(createdTime);
        room.setVersion(version);
        room.setTenantId(TenantId.fromUUID(tenantId));
        room.setSmartHomeId(new SmartHomeId(smartHomeId));
        room.setName(name);
        room.setIcon(icon);
        room.setSortOrder(sortOrder);
        room.setAdditionalInfo(additionalInfo);
        return room;
    }
}
