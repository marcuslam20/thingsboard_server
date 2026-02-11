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
package org.thingsboard.server.common.data.smarthome;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.thingsboard.server.common.data.BaseData;
import org.thingsboard.server.common.data.HasName;
import org.thingsboard.server.common.data.HasTenantId;
import org.thingsboard.server.common.data.HasVersion;
import org.thingsboard.server.common.data.id.RoomId;
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.validation.Length;
import org.thingsboard.server.common.data.validation.NoXss;

import java.io.Serial;

@Data
@Builder
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Room extends BaseData<RoomId> implements HasTenantId, HasName, HasVersion {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "Tenant that owns this room.", accessMode = Schema.AccessMode.READ_ONLY)
    private TenantId tenantId;

    @Schema(description = "Smart home this room belongs to.")
    private SmartHomeId smartHomeId;

    @NoXss
    @Length(min = 1, max = 255)
    @Schema(description = "Room name.", example = "Living Room")
    private String name;

    @NoXss
    @Length(max = 64)
    @Schema(description = "Room icon identifier.")
    private String icon;

    @Schema(description = "Sort order for display.")
    private int sortOrder;

    @Schema(description = "Additional info.")
    private String additionalInfo;

    @Schema(description = "Version for optimistic locking.", accessMode = Schema.AccessMode.READ_ONLY)
    private Long version;

    public Room() {}

    public Room(RoomId id) {
        super(id);
    }

    public Room(Room room) {
        super(room.getId());
        this.createdTime = room.getCreatedTime();
        this.tenantId = room.getTenantId();
        this.smartHomeId = room.getSmartHomeId();
        this.name = room.getName();
        this.icon = room.getIcon();
        this.sortOrder = room.getSortOrder();
        this.additionalInfo = room.getAdditionalInfo();
        this.version = room.getVersion();
    }
}
