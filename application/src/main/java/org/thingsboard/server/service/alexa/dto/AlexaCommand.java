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
 * DTO representing an Alexa command to be executed on a device.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlexaCommand {

    /**
     * Command name (e.g., "setPower", "setBrightness", "setTemperature").
     */
    private String command;

    /**
     * Command value (type depends on command).
     * - setPower: boolean (true/false) or string ("on"/"off")
     * - setBrightness: integer (0-100)
     * - setTemperature: double
     * - setColor: object with hue, saturation, brightness
     */
    private Object value;

    /**
     * Optional namespace for the command (e.g., "Alexa.PowerController").
     */
    private String namespace;

    /**
     * Optional correlation token for tracking.
     */
    private String correlationToken;
}
