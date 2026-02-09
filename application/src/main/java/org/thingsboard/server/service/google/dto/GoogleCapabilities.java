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

import java.util.List;
import java.util.Map;

/**
 * Represents Google Assistant capabilities for a device.
 * Stored in device additional_info as 'googleCapabilities'.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GoogleCapabilities {

    /**
     * Whether Google Assistant integration is enabled for this device
     */
    @JsonProperty("enabled")
    private boolean enabled;

    /**
     * Google device type (e.g., action.devices.types.LIGHT, action.devices.types.SWITCH)
     */
    @JsonProperty("deviceType")
    private String deviceType;

    /**
     * List of Google traits supported by this device (e.g., OnOff, Brightness, ColorSetting)
     * These are stored without the "action.devices.traits." prefix
     */
    @JsonProperty("traits")
    private List<String> traits;

    /**
     * Device-specific attributes required by certain traits
     * For example, ColorSetting trait requires colorModel, temperatureMinK, temperatureMaxK
     */
    @JsonProperty("attributes")
    private Map<String, Object> attributes;

    /**
     * Whether the device will report state changes to Google
     * Currently set to false (state is queried on demand)
     */
    @JsonProperty("willReportState")
    @Builder.Default
    private boolean willReportState = false;

    /**
     * Room hint for the device (optional)
     */
    @JsonProperty("roomHint")
    private String roomHint;

    /**
     * Custom names/nicknames for voice commands (optional)
     */
    @JsonProperty("nicknames")
    private List<String> nicknames;

    /**
     * Custom RPC method mapping for device-specific firmware.
     * If not specified, uses default ThingsBoard RPC methods.
     *
     * Example for custom firmware:
     * {
     *   "setPower": {
     *     "method": "setRelayState",
     *     "paramFormat": "numeric",
     *     "paramMapping": {"state": "value"}
     *   }
     * }
     *
     * Supported paramFormat:
     * - "object": Standard object format {"key": value}
     * - "numeric": Single numeric value (0/1 for boolean)
     * - "string": Single string value
     */
    @JsonProperty("rpcMapping")
    private Map<String, RpcMethodMapping> rpcMapping;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RpcMethodMapping {
        /**
         * Custom RPC method name to send to device
         */
        @JsonProperty("method")
        private String method;

        /**
         * Parameter format: "object", "numeric", or "string"
         */
        @JsonProperty("paramFormat")
        @Builder.Default
        private String paramFormat = "object";

        /**
         * Custom parameter name mapping
         * Maps standard param names to custom param names
         */
        @JsonProperty("paramMapping")
        private Map<String, String> paramMapping;
    }
}
