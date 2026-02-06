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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thingsboard.server.common.data.Device;
import org.thingsboard.server.common.data.DeviceProfile;
import org.thingsboard.server.common.data.User;
import org.thingsboard.server.common.data.id.CustomerId;
import org.thingsboard.server.common.data.id.DeviceId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.common.data.security.Authority;
import org.thingsboard.server.common.data.page.PageData;
import org.thingsboard.server.common.data.page.PageLink;
import org.thingsboard.server.dao.device.DeviceProfileService;
import org.thingsboard.server.dao.device.DeviceService;
import org.thingsboard.server.dao.user.UserService;
import org.thingsboard.server.service.alexa.dto.AlexaCapabilities;
import org.thingsboard.server.service.alexa.dto.AlexaCommand;
import org.thingsboard.server.service.alexa.dto.AlexaDevice;
import org.thingsboard.server.service.rpc.TbCoreDeviceRpcService;
import org.thingsboard.server.common.data.rpc.ToDeviceRpcRequestBody;
import org.thingsboard.server.common.msg.rpc.ToDeviceRpcRequest;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Implementation of AlexaService for Alexa Smart Home integration.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AlexaServiceImpl implements AlexaService {

    private final DeviceService deviceService;
    private final DeviceProfileService deviceProfileService;
    private final TbCoreDeviceRpcService rpcService;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    private static final int DEFAULT_RPC_TIMEOUT = 5000; // 5 seconds
    private static final int MAX_DEVICES_PER_PAGE = 100;

    @Override
    public List<AlexaDevice> getAlexaEnabledDevices(TenantId tenantId) {
        List<AlexaDevice> alexaDevices = new ArrayList<>();
        PageLink pageLink = new PageLink(MAX_DEVICES_PER_PAGE);

        // Iterate through all devices for the tenant
        PageData<Device> pageData;
        do {
            pageData = deviceService.findDevicesByTenantId(tenantId, pageLink);
            for (Device device : pageData.getData()) {
                AlexaCapabilities capabilities = getAlexaCapabilities(device);
                if (capabilities != null && capabilities.isEnabled()) {
                    alexaDevices.add(mapToAlexaDevice(device, capabilities));
                }
            }
            pageLink = pageLink.nextPageLink();
        } while (pageData.hasNext());

        log.info("Found {} Alexa-enabled devices for tenant {}", alexaDevices.size(), tenantId);
        return alexaDevices;
    }

    @Override
    public List<AlexaDevice> getAlexaEnabledDevices(TenantId tenantId, UserId userId) {
        User user = userService.findUserById(tenantId, userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found: " + userId);
        }

        // If customer user, scope devices to their customer
        if (Authority.CUSTOMER_USER.equals(user.getAuthority())) {
            CustomerId customerId = user.getCustomerId();
            if (customerId != null && !customerId.isNullUid()) {
                return getAlexaEnabledDevicesForCustomer(tenantId, customerId);
            }
        }

        // Tenant admin - return all tenant devices
        return getAlexaEnabledDevices(tenantId);
    }

    private List<AlexaDevice> getAlexaEnabledDevicesForCustomer(TenantId tenantId, CustomerId customerId) {
        List<AlexaDevice> alexaDevices = new ArrayList<>();
        PageLink pageLink = new PageLink(MAX_DEVICES_PER_PAGE);

        PageData<Device> pageData;
        do {
            pageData = deviceService.findDevicesByTenantIdAndCustomerId(tenantId, customerId, pageLink);
            for (Device device : pageData.getData()) {
                AlexaCapabilities capabilities = getAlexaCapabilities(device);
                if (capabilities != null && capabilities.isEnabled()) {
                    alexaDevices.add(mapToAlexaDevice(device, capabilities));
                }
            }
            pageLink = pageLink.nextPageLink();
        } while (pageData.hasNext());

        log.info("Found {} Alexa-enabled devices for customer {}", alexaDevices.size(), customerId);
        return alexaDevices;
    }

    @Override
    public AlexaDevice getAlexaDevice(TenantId tenantId, UUID deviceId) {
        Device device = deviceService.findDeviceById(tenantId, new DeviceId(deviceId));
        if (device == null) {
            throw new IllegalArgumentException("Device not found: " + deviceId);
        }

        AlexaCapabilities capabilities = getAlexaCapabilities(device);
        return mapToAlexaDevice(device, capabilities);
    }

    @Override
    public void executeCommand(TenantId tenantId, UUID deviceId, AlexaCommand command) {
        Device device = deviceService.findDeviceById(tenantId, new DeviceId(deviceId));
        if (device == null) {
            throw new IllegalArgumentException("Device not found: " + deviceId);
        }

        // Build RPC request based on command type
        String method;
        ObjectNode params = objectMapper.createObjectNode();

        switch (command.getCommand().toLowerCase()) {
            case "setpower":
                method = "setPower";
                params.put("state", command.getValue() != null && 
                    (Boolean.parseBoolean(command.getValue().toString()) || 
                     "on".equalsIgnoreCase(command.getValue().toString())));
                break;
            case "setbrightness":
                method = "setBrightness";
                params.put("brightness", Integer.parseInt(command.getValue().toString()));
                break;
            case "settemperature":
                method = "setTemperature";
                params.put("temperature", Double.parseDouble(command.getValue().toString()));
                break;
            case "setcolor":
                method = "setColor";
                if (command.getValue() instanceof JsonNode) {
                    params.set("color", (JsonNode) command.getValue());
                } else {
                    params.put("color", command.getValue().toString());
                }
                break;
            default:
                // Pass through custom commands
                method = command.getCommand();
                if (command.getValue() != null) {
                    params.putPOJO("value", command.getValue());
                }
        }

        // Send RPC to device
        sendRpcCommand(tenantId, device, method, params);
        log.info("Executed Alexa command {} on device {}", command.getCommand(), deviceId);
    }

    @Override
    public AlexaDevice configureAlexaCapabilities(TenantId tenantId, UUID deviceId, 
                                                   boolean enabled, String category) {
        Device device = deviceService.findDeviceById(tenantId, new DeviceId(deviceId));
        if (device == null) {
            throw new IllegalArgumentException("Device not found: " + deviceId);
        }

        // Get device profile and update Alexa capabilities
        DeviceProfile profile = deviceProfileService.findDeviceProfileById(
                tenantId, device.getDeviceProfileId());
        if (profile == null) {
            throw new IllegalArgumentException("Device profile not found");
        }

        // Update Alexa capabilities in additional info
        ObjectNode additionalInfo = device.getAdditionalInfo() != null ?
                (ObjectNode) device.getAdditionalInfo() : objectMapper.createObjectNode();

        ObjectNode alexaConfig = objectMapper.createObjectNode();
        alexaConfig.put("enabled", enabled);
        alexaConfig.put("category", category.toUpperCase());
        additionalInfo.set("alexaCapabilities", alexaConfig);

        device.setAdditionalInfo(additionalInfo);
        Device savedDevice = deviceService.saveDevice(device);

        AlexaCapabilities capabilities = new AlexaCapabilities();
        capabilities.setEnabled(enabled);
        capabilities.setCategory(category.toUpperCase());

        return mapToAlexaDevice(savedDevice, capabilities);
    }

    /**
     * Get Alexa capabilities from device additional info or profile.
     */
    private AlexaCapabilities getAlexaCapabilities(Device device) {
        JsonNode additionalInfo = device.getAdditionalInfo();
        if (additionalInfo != null && additionalInfo.has("alexaCapabilities")) {
            JsonNode alexaNode = additionalInfo.get("alexaCapabilities");
            AlexaCapabilities capabilities = new AlexaCapabilities();
            capabilities.setEnabled(alexaNode.path("enabled").asBoolean(false));
            capabilities.setCategory(alexaNode.path("category").asText("SWITCH"));
            capabilities.setPowerState(alexaNode.path("powerState").asBoolean(false));
            capabilities.setBrightness(alexaNode.path("brightness").asInt(100));
            return capabilities;
        }
        return null;
    }

    /**
     * Map Device to AlexaDevice DTO.
     */
    private AlexaDevice mapToAlexaDevice(Device device, AlexaCapabilities capabilities) {
        AlexaDevice alexaDevice = new AlexaDevice();
        alexaDevice.setId(device.getId().getId().toString());
        alexaDevice.setName(device.getName());
        alexaDevice.setType(device.getType());
        alexaDevice.setLabel(device.getLabel());
        alexaDevice.setAlexaCapabilities(capabilities != null ? capabilities : new AlexaCapabilities());
        return alexaDevice;
    }

    /**
     * Send RPC command to device.
     */
    private void sendRpcCommand(TenantId tenantId, Device device, String method, JsonNode params) {
        try {
            ToDeviceRpcRequestBody body = new ToDeviceRpcRequestBody(method, params.toString());
            ToDeviceRpcRequest rpcRequest = new ToDeviceRpcRequest(
                    UUID.randomUUID(),
                    tenantId,
                    device.getId(),
                    true, // one-way
                    System.currentTimeMillis() + TimeUnit.MILLISECONDS.toMillis(DEFAULT_RPC_TIMEOUT),
                    body,
                    false,
                    0,
                    null
            );

            rpcService.processRestApiRpcRequest(rpcRequest, response -> {
                log.debug("RPC command {} sent to device {}, response: {}", method, device.getId(), response);
            }, null);
        } catch (Exception e) {
            log.error("Error sending RPC command to device", e);
            throw new RuntimeException("Failed to send command to device", e);
        }
    }
}
