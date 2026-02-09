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
 * DTO representing Alexa-specific capabilities for a device.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlexaCapabilities {

    /**
     * Whether Alexa control is enabled for this device.
     */
    private boolean enabled = false;

    /**
     * Alexa display category (LIGHT, SWITCH, SMARTPLUG, THERMOSTAT, etc.).
     */
    private String category = "SWITCH";

    /**
     * Current power state (true = ON, false = OFF).
     */
    private Boolean powerState;

    /**
     * Current brightness level (0-100) for lights.
     */
    private Integer brightness;

    /**
     * Current temperature for thermostats/sensors.
     */
    private Double temperature;

    /**
     * Temperature scale (CELSIUS or FAHRENHEIT).
     */
    private String temperatureScale = "CELSIUS";

    /**
     * Thermostat mode (HEAT, COOL, AUTO, OFF).
     */
    private String thermostatMode;
}
