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
package org.thingsboard.server.service.alexa;

import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.service.alexa.dto.AlexaCommand;
import org.thingsboard.server.service.alexa.dto.AlexaDevice;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for Alexa Smart Home integration.
 * Provides methods for device discovery and command execution.
 */
public interface AlexaService {

    /**
     * Get all devices that have Alexa capabilities enabled for a tenant.
     *
     * @param tenantId The tenant ID
     * @return List of Alexa-enabled devices
     */
    List<AlexaDevice> getAlexaEnabledDevices(TenantId tenantId);

    /**
     * Get Alexa-enabled devices scoped to the given user.
     * If the user is a customer user, only returns devices assigned to that customer.
     * If the user is a tenant admin, returns all tenant devices.
     *
     * @param tenantId The tenant ID
     * @param userId The user ID (used to determine customer scope)
     * @return List of Alexa-enabled devices visible to the user
     */
    List<AlexaDevice> getAlexaEnabledDevices(TenantId tenantId, UserId userId);

    /**
     * Get a specific device by ID with its Alexa capabilities.
     *
     * @param tenantId The tenant ID
     * @param deviceId The device UUID
     * @return The device with Alexa capabilities
     */
    AlexaDevice getAlexaDevice(TenantId tenantId, UUID deviceId);

    /**
     * Execute an Alexa command on a device.
     *
     * @param tenantId The tenant ID
     * @param deviceId The device UUID
     * @param command The command to execute
     */
    void executeCommand(TenantId tenantId, UUID deviceId, AlexaCommand command);

    /**
     * Configure Alexa capabilities for a device.
     *
     * @param tenantId The tenant ID
     * @param deviceId The device UUID
     * @param enabled Whether to enable Alexa
     * @param category The Alexa device category
     * @return Updated device with Alexa capabilities
     */
    AlexaDevice configureAlexaCapabilities(TenantId tenantId, UUID deviceId, boolean enabled, String category);
}
