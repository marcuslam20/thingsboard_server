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

import java.util.List;

/**
 * Request for EXECUTE intent from Google Assistant.
 * Contains commands to execute on one or more devices.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GoogleExecuteRequest {

    @JsonProperty("requestId")
    private String requestId;

    @JsonProperty("inputs")
    private List<Input> inputs;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Input {
        @JsonProperty("intent")
        private String intent;

        @JsonProperty("payload")
        private Payload payload;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Payload {
        @JsonProperty("commands")
        private List<Command> commands;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Command {
        @JsonProperty("devices")
        private List<DeviceTarget> devices;

        @JsonProperty("execution")
        private List<Execution> execution;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeviceTarget {
        @JsonProperty("id")
        private String id;

        @JsonProperty("customData")
        private JsonNode customData;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Execution {
        @JsonProperty("command")
        private String command;

        @JsonProperty("params")
        private JsonNode params;
    }
}
