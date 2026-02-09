/**
 * Copyright © 2016-2024 The Thingsboard Authors
 * Copyright © 2024 PachiraMining
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
package org.thingsboard.server.service.alexa.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO representing a device for Alexa Smart Home integration.
 * Contains device information and Alexa-specific capabilities.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlexaDevice {

    /**
     * Unique device identifier (ThingsBoard device UUID).
     */
    private String id;

    /**
     * Device name as configured in ThingsBoard.
     */
    private String name;

    /**
     * Device type (e.g., "switch", "light", "thermostat").
     */
    private String type;

    /**
     * Optional user-friendly label for the device.
     */
    private String label;

    /**
     * Alexa-specific capabilities for this device.
     */
    private AlexaCapabilities alexaCapabilities;
}
