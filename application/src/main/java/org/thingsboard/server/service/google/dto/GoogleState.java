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

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

/**
 * Represents the current state of a device for Google Assistant.
 * The state properties are dynamic based on the device's traits.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GoogleState {

    /**
     * Whether the device is online
     */
    @JsonProperty("online")
    @Builder.Default
    private boolean online = true;

    /**
     * Dynamic state properties based on device traits.
     * Examples:
     * - OnOff trait: {"on": true}
     * - Brightness trait: {"brightness": 75}
     * - ColorSetting trait: {"color": {"spectrumRgb": 16711680}}
     * - TemperatureSetting trait: {"thermostatMode": "heat", "thermostatTemperatureSetpoint": 22.0}
     */
    @Builder.Default
    private Map<String, Object> state = new HashMap<>();

    @JsonAnyGetter
    public Map<String, Object> getState() {
        return state;
    }

    @JsonAnySetter
    public void setState(String key, Object value) {
        this.state.put(key, value);
    }

    /**
     * Add a state property
     */
    public void addStateProperty(String key, Object value) {
        this.state.put(key, value);
    }

    /**
     * Get a state property
     */
    public Object getStateProperty(String key) {
        return this.state.get(key);
    }
}
