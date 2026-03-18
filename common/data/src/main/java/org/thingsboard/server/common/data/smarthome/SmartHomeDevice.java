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
import lombok.NoArgsConstructor;
import org.thingsboard.server.common.data.id.DeviceId;
import org.thingsboard.server.common.data.id.RoomId;
import org.thingsboard.server.common.data.id.SmartHomeId;

import java.io.Serial;
import java.io.Serializable;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmartHomeDevice implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "Unique ID.", accessMode = Schema.AccessMode.READ_ONLY)
    private UUID id;

    @Schema(description = "Created time.", accessMode = Schema.AccessMode.READ_ONLY)
    private long createdTime;

    @Schema(description = "Smart home this device belongs to.")
    private SmartHomeId smartHomeId;

    @Schema(description = "Device ID.")
    private DeviceId deviceId;

    @Schema(description = "Room ID (null if not assigned to a room).")
    private RoomId roomId;

    @Schema(description = "Custom device name within this home (null = use original device name).")
    private String deviceName;

    @Schema(description = "Sort order for display.")
    private int sortOrder;
}
