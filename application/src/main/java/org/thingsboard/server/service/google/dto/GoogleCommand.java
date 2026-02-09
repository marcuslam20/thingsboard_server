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
package org.thingsboard.server.service.google.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Represents a Google Assistant command to be executed on a device
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GoogleCommand {

    /**
     * Target device ID
     */
    @JsonProperty("deviceId")
    private UUID deviceId;

    /**
     * Google command name (e.g., action.devices.commands.OnOff)
     * Stored without the "action.devices.commands." prefix in this DTO
     */
    @JsonProperty("command")
    private String command;

    /**
     * Command parameters as JSON
     * For example:
     * - OnOff: {"on": true}
     * - BrightnessAbsolute: {"brightness": 75}
     * - ColorAbsolute: {"color": {"spectrumRGB": 16711680}}
     */
    @JsonProperty("params")
    private JsonNode params;

    /**
     * Request ID from Google for tracking
     */
    @JsonProperty("requestId")
    private String requestId;
}
