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

import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.thingsboard.server.common.data.id.DeviceProfileId;
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.id.TenantId;

import java.io.Serial;
import java.io.Serializable;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceGroup implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "Device group ID.", accessMode = Schema.AccessMode.READ_ONLY)
    private UUID id;

    @Schema(description = "Created time.", accessMode = Schema.AccessMode.READ_ONLY)
    private long createdTime;

    @Schema(description = "Tenant ID.")
    private TenantId tenantId;

    @Schema(description = "Smart home this group belongs to.")
    private SmartHomeId smartHomeId;

    @Schema(description = "Group name.")
    private String name;

    @Schema(description = "Device profile for devices in this group.")
    private DeviceProfileId deviceProfileId;

    @Schema(description = "Group icon.")
    private String icon;

    @Schema(description = "Additional info.")
    private JsonNode additionalInfo;

    @Schema(description = "Version for optimistic locking.", accessMode = Schema.AccessMode.READ_ONLY)
    private Long version;
}
