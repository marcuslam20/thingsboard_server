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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Represents a ThingsBoard device with Google Assistant capabilities
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GoogleDevice {

    /**
     * ThingsBoard device ID
     */
    @JsonProperty("id")
    private UUID id;

    /**
     * Device name
     */
    @JsonProperty("name")
    private String name;

    /**
     * Device label (optional)
     */
    @JsonProperty("label")
    private String label;

    /**
     * ThingsBoard device type
     */
    @JsonProperty("type")
    private String type;

    /**
     * Google Assistant capabilities configuration
     */
    @JsonProperty("googleCapabilities")
    private GoogleCapabilities googleCapabilities;

    /**
     * Whether the device is currently active
     */
    @JsonProperty("active")
    private boolean active;

    /**
     * Device creation timestamp
     */
    @JsonProperty("createdTime")
    private Long createdTime;
}
