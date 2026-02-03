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
 * Response for SYNC intent to Google Assistant.
 * Returns all available devices with their capabilities.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GoogleSyncResponse {

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
        @JsonProperty("agentUserId")
        private String agentUserId;

        @JsonProperty("devices")
        private List<Device> devices;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Device {
        @JsonProperty("id")
        private String id;

        @JsonProperty("type")
        private String type;

        @JsonProperty("traits")
        private List<String> traits;

        @JsonProperty("name")
        private DeviceName name;

        @JsonProperty("willReportState")
        private boolean willReportState;

        @JsonProperty("roomHint")
        private String roomHint;

        @JsonProperty("deviceInfo")
        private DeviceInfo deviceInfo;

        @JsonProperty("attributes")
        private Map<String, Object> attributes;

        @JsonProperty("customData")
        private Map<String, Object> customData;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeviceName {
        @JsonProperty("defaultNames")
        private List<String> defaultNames;

        @JsonProperty("name")
        private String name;

        @JsonProperty("nicknames")
        private List<String> nicknames;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeviceInfo {
        @JsonProperty("manufacturer")
        private String manufacturer;

        @JsonProperty("model")
        private String model;

        @JsonProperty("hwVersion")
        private String hwVersion;

        @JsonProperty("swVersion")
        private String swVersion;
    }
}
