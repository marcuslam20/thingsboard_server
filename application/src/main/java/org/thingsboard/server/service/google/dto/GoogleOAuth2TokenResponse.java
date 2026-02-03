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

/**
 * OAuth2 token response returned to Google during token exchange.
 * Follows OAuth2 specification for token endpoint response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GoogleOAuth2TokenResponse {

    /**
     * The access token issued by the authorization server
     */
    @JsonProperty("access_token")
    private String accessToken;

    /**
     * The type of token (always "Bearer" for our implementation)
     */
    @JsonProperty("token_type")
    @Builder.Default
    private String tokenType = "Bearer";

    /**
     * The lifetime in seconds of the access token
     */
    @JsonProperty("expires_in")
    private Long expiresIn;

    /**
     * The refresh token which can be used to obtain new access tokens
     */
    @JsonProperty("refresh_token")
    private String refreshToken;

    /**
     * Error code if token exchange failed
     */
    @JsonProperty("error")
    private String error;

    /**
     * Human-readable error description
     */
    @JsonProperty("error_description")
    private String errorDescription;
}
