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
 * Response for EXECUTE intent to Google Assistant.
 * Returns execution results for each device command.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GoogleExecuteResponse {

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
        @JsonProperty("commands")
        private List<CommandResult> commands;

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
    public static class CommandResult {
        @JsonProperty("ids")
        private List<String> ids;

        @JsonProperty("status")
        private String status;  // SUCCESS, PENDING, OFFLINE, ERROR

        @JsonProperty("states")
        private Map<String, Object> states;

        @JsonProperty("errorCode")
        private String errorCode;  // deviceOffline, deviceTurnedOff, etc.

        @JsonProperty("debugString")
        private String debugString;
    }
}
