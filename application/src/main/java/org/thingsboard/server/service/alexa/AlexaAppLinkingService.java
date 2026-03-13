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
package org.thingsboard.server.service.alexa;

import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.service.alexa.dto.AppLinkingStartResponse;

/**
 * Service for handling Alexa app-to-app account linking flow.
 * Implements the flow described in Amazon's documentation:
 * https://developer.amazon.com/en-US/docs/alexa/account-linking/app-to-app-account-linking-starting-from-your-app.html
 */
public interface AlexaAppLinkingService {

    /**
     * Start the app-to-app linking flow.
     * Generates state, PKCE parameters, and returns Alexa app + LWA fallback URLs.
     *
     * @param tenantId the tenant ID
     * @param userId the user ID
     * @return response containing URLs and state
     */
    AppLinkingStartResponse startLinking(TenantId tenantId, UserId userId);

    /**
     * Complete the app-to-app linking flow.
     * Exchanges Amazon auth code for Amazon access token,
     * generates a ThingsBoard auth code, and calls Skill Enablement API.
     *
     * @param tenantId the tenant ID
     * @param userId the user ID
     * @param amazonAuthCode the Amazon authorization code from LWA redirect
     * @param state the state parameter for validation
     */
    void completeLinking(TenantId tenantId, UserId userId, String amazonAuthCode, String state);

    /**
     * Validate and consume a state parameter.
     *
     * @param state the state to validate
     * @return the user ID associated with this state
     * @throws IllegalArgumentException if state is invalid or expired
     */
    UserId validateState(String state);

    /**
     * Get the mobile app callback URI (custom scheme).
     *
     * @return the app callback URI (e.g., osprey://alexa-callback)
     */
    String getAppCallbackScheme();
}
