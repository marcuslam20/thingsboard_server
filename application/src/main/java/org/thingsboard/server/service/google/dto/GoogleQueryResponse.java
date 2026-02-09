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

import java.util.Map;

/**
 * Response for QUERY intent to Google Assistant.
 * Returns the current state of requested devices.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GoogleQueryResponse {

    @JsonProperty("requestId")
    private String requestId;

    @JsonProperty("payload")
    private Payload payload;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Payload {
        /**
         * Map of device ID to device state
         * Key: device ID (string)
         * Value: device state (online status + trait states)
         */
        @JsonProperty("devices")
        private Map<String, DeviceState> devices;

        @JsonProperty("errorCode")
        private String errorCode;

        @JsonProperty("debugString")
        private String debugString;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DeviceState {
        @JsonProperty("online")
        private boolean online;

        @JsonProperty("status")
        private String status;  // SUCCESS, OFFLINE, ERROR, etc.

        @JsonProperty("errorCode")
        private String errorCode;

        /**
         * Dynamic state properties based on device traits
         * Use GoogleState to build this
         */
        @JsonProperty("states")
        private Map<String, Object> states;
    }
}
