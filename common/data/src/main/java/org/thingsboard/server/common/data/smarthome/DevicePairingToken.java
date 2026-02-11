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
import org.thingsboard.server.common.data.id.DeviceId;
import org.thingsboard.server.common.data.id.DeviceProfileId;
import org.thingsboard.server.common.data.id.RoomId;
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.id.TenantId;

import java.io.Serial;
import java.io.Serializable;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DevicePairingToken implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "Pairing token record ID.", accessMode = Schema.AccessMode.READ_ONLY)
    private UUID id;

    @Schema(description = "Created time.", accessMode = Schema.AccessMode.READ_ONLY)
    private long createdTime;

    @Schema(description = "Tenant ID.")
    private TenantId tenantId;

    @Schema(description = "Device profile to pair.")
    private DeviceProfileId deviceProfileId;

    @Schema(description = "Smart home to assign the device to.")
    private SmartHomeId smartHomeId;

    @Schema(description = "Room to assign the device to (optional).")
    private RoomId roomId;

    @Schema(description = "The pairing token string.", accessMode = Schema.AccessMode.READ_ONLY)
    private String token;

    @Schema(description = "Status of the pairing token.")
    private DevicePairingStatus status;

    @Schema(description = "Device ID after pairing is confirmed.", accessMode = Schema.AccessMode.READ_ONLY)
    private DeviceId deviceId;

    @Schema(description = "Expiration timestamp.", accessMode = Schema.AccessMode.READ_ONLY)
    private long expiresAt;

    @Schema(description = "Additional pairing data (e.g. WiFi credentials).")
    private JsonNode pairingData;
}
