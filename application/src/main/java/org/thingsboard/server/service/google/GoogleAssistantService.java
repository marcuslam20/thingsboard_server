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
package org.thingsboard.server.service.google;

import org.thingsboard.server.common.data.id.DeviceId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.service.google.dto.GoogleCapabilities;
import org.thingsboard.server.service.google.dto.GoogleCommand;
import org.thingsboard.server.service.google.dto.GoogleDevice;
import org.thingsboard.server.service.google.dto.GoogleState;

import java.util.List;
import java.util.UUID;

/**
 * Service for managing Google Assistant Smart Home integration.
 * Handles device discovery, command execution, and state queries.
 */
public interface GoogleAssistantService {

    /**
     * Get all devices with Google Assistant enabled for a tenant.
     *
     * @param tenantId the tenant ID
     * @return list of Google-enabled devices
     */
    List<GoogleDevice> getGoogleEnabledDevices(TenantId tenantId);

    /**
     * Get all devices with Google Assistant enabled for a specific user.
     * Filters devices based on user role:
     * - Tenant Admin: returns all tenant devices
     * - Customer User: returns only devices assigned to user's customer
     *
     * @param tenantId the tenant ID
     * @param userId the user ID
     * @return list of Google-enabled devices for this user
     */
    List<GoogleDevice> getGoogleEnabledDevicesForUser(TenantId tenantId, UserId userId);

    /**
     * Get a specific device with Google Assistant capabilities.
     *
     * @param tenantId the tenant ID
     * @param deviceId the device ID
     * @return the device with Google capabilities
     * @throws IllegalArgumentException if device not found or not Google-enabled
     */
    GoogleDevice getGoogleDevice(TenantId tenantId, DeviceId deviceId);

    /**
     * Execute a Google Assistant command on a device.
     * Maps Google commands to ThingsBoard RPC calls.
     *
     * @param tenantId the tenant ID
     * @param deviceId the device ID
     * @param command the Google command to execute
     * @throws IllegalArgumentException if device not found or command invalid
     */
    void executeCommand(TenantId tenantId, DeviceId deviceId, GoogleCommand command);

    /**
     * Query the current state of a device.
     * Returns state based on device attributes and latest telemetry.
     *
     * @param tenantId the tenant ID
     * @param deviceId the device ID
     * @return the current device state
     * @throws IllegalArgumentException if device not found
     */
    GoogleState queryDeviceState(TenantId tenantId, DeviceId deviceId);

    /**
     * Configure Google Assistant capabilities for a device.
     * Updates device additional_info with googleCapabilities.
     *
     * @param tenantId the tenant ID
     * @param deviceId the device ID
     * @param capabilities the Google capabilities configuration
     * @return the updated device
     * @throws IllegalArgumentException if device not found
     */
    GoogleDevice configureGoogleCapabilities(TenantId tenantId, DeviceId deviceId, GoogleCapabilities capabilities);

    /**
     * Enable Google Assistant for a device.
     *
     * @param tenantId the tenant ID
     * @param deviceId the device ID
     * @param enabled whether to enable or disable
     * @return the updated device
     */
    GoogleDevice setGoogleEnabled(TenantId tenantId, DeviceId deviceId, boolean enabled);

    /**
     * Get default Google capabilities for a device based on its type.
     * Used when initially enabling Google Assistant for a device.
     *
     * @param deviceType the ThingsBoard device type
     * @return suggested Google capabilities
     */
    GoogleCapabilities getDefaultCapabilities(String deviceType);
}
