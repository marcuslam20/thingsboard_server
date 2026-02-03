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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thingsboard.server.common.data.AttributeScope;
import org.thingsboard.server.common.data.Device;
import org.thingsboard.server.common.data.id.DeviceId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.kv.AttributeKvEntry;
import org.thingsboard.server.common.data.kv.BaseReadTsKvQuery;
import org.thingsboard.server.common.data.kv.ReadTsKvQuery;
import org.thingsboard.server.common.data.kv.TsKvEntry;
import org.thingsboard.server.common.data.page.PageData;
import org.thingsboard.server.common.data.page.PageLink;
import org.thingsboard.server.common.data.rpc.RpcError;
import org.thingsboard.server.common.data.rpc.ToDeviceRpcRequestBody;
import org.thingsboard.server.common.msg.rpc.FromDeviceRpcResponse;
import org.thingsboard.server.common.msg.rpc.ToDeviceRpcRequest;
import org.thingsboard.server.dao.attributes.AttributesService;
import org.thingsboard.server.dao.device.DeviceService;
import org.thingsboard.server.dao.timeseries.TimeseriesService;
import org.thingsboard.server.queue.util.TbCoreComponent;
import org.thingsboard.server.service.google.dto.GoogleCapabilities;
import org.thingsboard.server.service.google.dto.GoogleCommand;
import org.thingsboard.server.service.google.dto.GoogleDevice;
import org.thingsboard.server.service.google.dto.GoogleState;
import org.thingsboard.server.service.rpc.TbCoreDeviceRpcService;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@Slf4j
@TbCoreComponent
@RequiredArgsConstructor
public class GoogleAssistantServiceImpl implements GoogleAssistantService {

    private final DeviceService deviceService;
    private final AttributesService attributesService;
    private final TimeseriesService timeseriesService;
    private final TbCoreDeviceRpcService deviceRpcService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String GOOGLE_CAPABILITIES_KEY = "googleCapabilities";
    private static final String ENABLED_KEY = "enabled";
    private static final int RPC_TIMEOUT_SECONDS = 10;

    @Override
    public List<GoogleDevice> getGoogleEnabledDevices(TenantId tenantId) {
        log.debug("Getting Google-enabled devices for tenant: {}", tenantId);

        List<GoogleDevice> googleDevices = new ArrayList<>();
        PageLink pageLink = new PageLink(100);

        do {
            PageData<Device> pageData = deviceService.findDevicesByTenantId(tenantId, pageLink);

            for (Device device : pageData.getData()) {
                try {
                    JsonNode additionalInfo = device.getAdditionalInfo();
                    if (additionalInfo != null && additionalInfo.has(GOOGLE_CAPABILITIES_KEY)) {
                        JsonNode capabilities = additionalInfo.get(GOOGLE_CAPABILITIES_KEY);
                        if (capabilities.has(ENABLED_KEY) && capabilities.get(ENABLED_KEY).asBoolean()) {
                            googleDevices.add(mapToGoogleDevice(device));
                        }
                    }
                } catch (Exception e) {
                    log.error("Error processing device {}: {}", device.getId(), e.getMessage(), e);
                }
            }

            if (pageData.hasNext()) {
                pageLink = pageLink.nextPageLink();
            } else {
                break;
            }
        } while (true);

        log.debug("Found {} Google-enabled devices for tenant: {}", googleDevices.size(), tenantId);
        return googleDevices;
    }

    @Override
    public GoogleDevice getGoogleDevice(TenantId tenantId, DeviceId deviceId) {
        log.debug("Getting Google device: {}", deviceId);

        Device device = deviceService.findDeviceById(tenantId, deviceId);
        if (device == null) {
            throw new IllegalArgumentException("Device not found: " + deviceId);
        }

        JsonNode additionalInfo = device.getAdditionalInfo();
        if (additionalInfo == null || !additionalInfo.has(GOOGLE_CAPABILITIES_KEY)) {
            throw new IllegalArgumentException("Device does not have Google capabilities configured: " + deviceId);
        }

        JsonNode capabilities = additionalInfo.get(GOOGLE_CAPABILITIES_KEY);
        if (!capabilities.has(ENABLED_KEY) || !capabilities.get(ENABLED_KEY).asBoolean()) {
            throw new IllegalArgumentException("Google Assistant is not enabled for device: " + deviceId);
        }

        return mapToGoogleDevice(device);
    }

    @Override
    public void executeCommand(TenantId tenantId, DeviceId deviceId, GoogleCommand command) {
        log.debug("Executing Google command {} on device {}", command.getCommand(), deviceId);

        Device device = deviceService.findDeviceById(tenantId, deviceId);
        if (device == null) {
            throw new IllegalArgumentException("Device not found: " + deviceId);
        }

        // Map Google command to RPC method and params
        String rpcMethod = mapCommandToRpcMethod(command.getCommand());
        ObjectNode rpcParams = mapCommandParams(command.getCommand(), command.getParams());

        // Send RPC command to device
        try {
            sendRpcCommand(device, rpcMethod, rpcParams);
            log.debug("Command executed successfully on device: {}", deviceId);
        } catch (Exception e) {
            log.error("Error executing command on device {}: {}", deviceId, e.getMessage(), e);
            throw new RuntimeException("Failed to execute command: " + e.getMessage(), e);
        }
    }

    @Override
    public GoogleState queryDeviceState(TenantId tenantId, DeviceId deviceId) {
        log.debug("Querying device state for device: {}", deviceId);

        Device device = deviceService.findDeviceById(tenantId, deviceId);
        if (device == null) {
            throw new IllegalArgumentException("Device not found: " + deviceId);
        }

        GoogleDevice googleDevice = mapToGoogleDevice(device);
        GoogleState state = GoogleState.builder().online(true).build();

        // Get device traits and query state for each
        List<String> traits = googleDevice.getGoogleCapabilities().getTraits();
        if (traits != null) {
            for (String trait : traits) {
                Map<String, Object> traitState = queryTraitState(tenantId, deviceId, trait);
                traitState.forEach(state::addStateProperty);
            }
        }

        log.debug("Device state queried successfully for device: {}", deviceId);
        return state;
    }

    @Override
    public GoogleDevice configureGoogleCapabilities(TenantId tenantId, DeviceId deviceId, GoogleCapabilities capabilities) {
        log.debug("Configuring Google capabilities for device: {}", deviceId);

        Device device = deviceService.findDeviceById(tenantId, deviceId);
        if (device == null) {
            throw new IllegalArgumentException("Device not found: " + deviceId);
        }

        try {
            JsonNode additionalInfo = device.getAdditionalInfo();
            ObjectNode additionalInfoNode;

            if (additionalInfo == null || additionalInfo.isNull()) {
                additionalInfoNode = objectMapper.createObjectNode();
            } else {
                additionalInfoNode = (ObjectNode) additionalInfo;
            }

            // Serialize capabilities to JSON
            JsonNode capabilitiesNode = objectMapper.valueToTree(capabilities);
            additionalInfoNode.set(GOOGLE_CAPABILITIES_KEY, capabilitiesNode);

            device.setAdditionalInfo(additionalInfoNode);
            device = deviceService.saveDevice(device);

            log.debug("Google capabilities configured successfully for device: {}", deviceId);
            return mapToGoogleDevice(device);
        } catch (Exception e) {
            log.error("Error configuring Google capabilities for device {}: {}", deviceId, e.getMessage(), e);
            throw new RuntimeException("Failed to configure Google capabilities: " + e.getMessage(), e);
        }
    }

    @Override
    public GoogleDevice setGoogleEnabled(TenantId tenantId, DeviceId deviceId, boolean enabled) {
        log.debug("Setting Google enabled={} for device: {}", enabled, deviceId);

        Device device = deviceService.findDeviceById(tenantId, deviceId);
        if (device == null) {
            throw new IllegalArgumentException("Device not found: " + deviceId);
        }

        try {
            JsonNode additionalInfo = device.getAdditionalInfo();
            ObjectNode additionalInfoNode;

            if (additionalInfo == null || additionalInfo.isNull()) {
                additionalInfoNode = objectMapper.createObjectNode();
            } else {
                additionalInfoNode = (ObjectNode) additionalInfo;
            }

            ObjectNode capabilitiesNode;
            if (additionalInfoNode.has(GOOGLE_CAPABILITIES_KEY)) {
                capabilitiesNode = (ObjectNode) additionalInfoNode.get(GOOGLE_CAPABILITIES_KEY);
            } else {
                // Create default capabilities if not exists
                GoogleCapabilities defaultCaps = getDefaultCapabilities(device.getType());
                capabilitiesNode = (ObjectNode) objectMapper.valueToTree(defaultCaps);
            }

            capabilitiesNode.put(ENABLED_KEY, enabled);
            additionalInfoNode.set(GOOGLE_CAPABILITIES_KEY, capabilitiesNode);

            device.setAdditionalInfo(additionalInfoNode);
            device = deviceService.saveDevice(device);

            log.debug("Google enabled set successfully for device: {}", deviceId);
            return mapToGoogleDevice(device);
        } catch (Exception e) {
            log.error("Error setting Google enabled for device {}: {}", deviceId, e.getMessage(), e);
            throw new RuntimeException("Failed to set Google enabled: " + e.getMessage(), e);
        }
    }

    @Override
    public GoogleCapabilities getDefaultCapabilities(String deviceType) {
        log.debug("Getting default Google capabilities for device type: {}", deviceType);

        String lowerType = deviceType.toLowerCase();
        String googleDeviceType;
        List<String> traits;

        // Map device type to Google device type and traits
        switch (lowerType) {
            case "light":
            case "lamp":
            case "bulb":
                googleDeviceType = "action.devices.types.LIGHT";
                traits = Arrays.asList("OnOff", "Brightness");
                break;
            case "switch":
                googleDeviceType = "action.devices.types.SWITCH";
                traits = Collections.singletonList("OnOff");
                break;
            case "outlet":
            case "smartplug":
                googleDeviceType = "action.devices.types.OUTLET";
                traits = Collections.singletonList("OnOff");
                break;
            case "thermostat":
            case "hvac":
                googleDeviceType = "action.devices.types.THERMOSTAT";
                traits = Arrays.asList("TemperatureSetting");
                break;
            case "fan":
                googleDeviceType = "action.devices.types.FAN";
                traits = Arrays.asList("OnOff", "FanSpeed");
                break;
            case "lock":
            case "door_lock":
                googleDeviceType = "action.devices.types.LOCK";
                traits = Collections.singletonList("LockUnlock");
                break;
            default:
                googleDeviceType = "action.devices.types.SWITCH";
                traits = Collections.singletonList("OnOff");
        }

        return GoogleCapabilities.builder()
                .enabled(false)
                .deviceType(googleDeviceType)
                .traits(traits)
                .willReportState(false)
                .build();
    }

    private GoogleDevice mapToGoogleDevice(Device device) {
        try {
            JsonNode additionalInfo = device.getAdditionalInfo();
            GoogleCapabilities capabilities = null;

            if (additionalInfo != null && additionalInfo.has(GOOGLE_CAPABILITIES_KEY)) {
                JsonNode capabilitiesNode = additionalInfo.get(GOOGLE_CAPABILITIES_KEY);
                capabilities = objectMapper.treeToValue(capabilitiesNode, GoogleCapabilities.class);
            }

            return GoogleDevice.builder()
                    .id(device.getUuidId())
                    .name(device.getName())
                    .label(device.getLabel())
                    .type(device.getType())
                    .googleCapabilities(capabilities)
                    .active(true)
                    .createdTime(device.getCreatedTime())
                    .build();
        } catch (Exception e) {
            log.error("Error mapping device to GoogleDevice: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to map device: " + e.getMessage(), e);
        }
    }

    private String mapCommandToRpcMethod(String googleCommand) {
        switch (googleCommand) {
            case "action.devices.commands.OnOff":
            case "OnOff":
                return "setPower";
            case "action.devices.commands.BrightnessAbsolute":
            case "BrightnessAbsolute":
                return "setBrightness";
            case "action.devices.commands.ColorAbsolute":
            case "ColorAbsolute":
                return "setColor";
            case "action.devices.commands.ThermostatTemperatureSetpoint":
            case "ThermostatTemperatureSetpoint":
                return "setTemperature";
            case "action.devices.commands.ThermostatSetMode":
            case "ThermostatSetMode":
                return "setMode";
            case "action.devices.commands.SetFanSpeed":
            case "SetFanSpeed":
                return "setFanSpeed";
            case "action.devices.commands.LockUnlock":
            case "LockUnlock":
                return "setLocked";
            default:
                log.warn("Unknown Google command: {}", googleCommand);
                return "unknown";
        }
    }

    private ObjectNode mapCommandParams(String googleCommand, JsonNode params) {
        ObjectNode rpcParams = objectMapper.createObjectNode();

        switch (googleCommand) {
            case "action.devices.commands.OnOff":
            case "OnOff":
                if (params.has("on")) {
                    rpcParams.put("state", params.get("on").asBoolean());
                }
                break;
            case "action.devices.commands.BrightnessAbsolute":
            case "BrightnessAbsolute":
                if (params.has("brightness")) {
                    rpcParams.put("brightness", params.get("brightness").asInt());
                }
                break;
            case "action.devices.commands.ColorAbsolute":
            case "ColorAbsolute":
                if (params.has("color")) {
                    JsonNode color = params.get("color");
                    if (color.has("spectrumRGB")) {
                        rpcParams.put("color", color.get("spectrumRGB").asInt());
                    }
                }
                break;
            case "action.devices.commands.ThermostatTemperatureSetpoint":
            case "ThermostatTemperatureSetpoint":
                if (params.has("thermostatTemperatureSetpoint")) {
                    rpcParams.put("temperature", params.get("thermostatTemperatureSetpoint").asDouble());
                }
                break;
            case "action.devices.commands.ThermostatSetMode":
            case "ThermostatSetMode":
                if (params.has("thermostatMode")) {
                    rpcParams.put("mode", params.get("thermostatMode").asText());
                }
                break;
            case "action.devices.commands.SetFanSpeed":
            case "SetFanSpeed":
                if (params.has("fanSpeed")) {
                    rpcParams.put("speed", params.get("fanSpeed").asText());
                }
                break;
            case "action.devices.commands.LockUnlock":
            case "LockUnlock":
                if (params.has("lock")) {
                    rpcParams.put("locked", params.get("lock").asBoolean());
                }
                break;
        }

        return rpcParams;
    }

    private void sendRpcCommand(Device device, String method, ObjectNode params) {
        try {
            log.debug("Sending RPC command to device {}: method={}, params={}", device.getId(), method, params);

            // Create RPC request body
            ToDeviceRpcRequestBody body = new ToDeviceRpcRequestBody(method, params.toString());

            // Create RPC request
            ToDeviceRpcRequest rpcRequest = new ToDeviceRpcRequest(
                UUID.randomUUID(),
                device.getTenantId(),
                device.getId(),
                true, // oneWay - we don't need a response
                System.currentTimeMillis() + 10000, // 10 second timeout
                body, // body
                false, // not persisted
                null, // no retries
                null // no additional info
            );

            // Send RPC command with callback
            deviceRpcService.processRestApiRpcRequest(
                rpcRequest,
                response -> {
                    if (response.getError().isPresent()) {
                        log.error("RPC command failed for device {}: {}", device.getId(), response.getError().get());
                    } else {
                        log.debug("RPC command sent successfully to device {}", device.getId());
                    }
                },
                null // SecurityUser - null for system calls
            );
        } catch (Exception e) {
            log.error("Error sending RPC command to device {}: {}", device.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to send RPC command: " + e.getMessage(), e);
        }
    }

    private Map<String, Object> queryTraitState(TenantId tenantId, DeviceId deviceId, String trait) {
        Map<String, Object> state = new HashMap<>();

        try {
            switch (trait) {
                case "OnOff":
                    // Query 'on' state from latest telemetry or attributes
                    Optional<Boolean> onState = getLatestBooleanValue(tenantId, deviceId, "on");
                    state.put("on", onState.orElse(false));
                    break;
                case "Brightness":
                    // Query brightness from latest telemetry
                    Optional<Integer> brightness = getLatestIntValue(tenantId, deviceId, "brightness");
                    state.put("brightness", brightness.orElse(0));
                    break;
                case "ColorSetting":
                    // Query color from latest telemetry
                    Optional<Integer> color = getLatestIntValue(tenantId, deviceId, "color");
                    if (color.isPresent()) {
                        Map<String, Object> colorData = new HashMap<>();
                        colorData.put("spectrumRgb", color.get());
                        state.put("color", colorData);
                    }
                    break;
                case "TemperatureSetting":
                    // Query thermostat state
                    Optional<Double> temp = getLatestDoubleValue(tenantId, deviceId, "temperature");
                    Optional<String> mode = getLatestStringValue(tenantId, deviceId, "mode");
                    state.put("thermostatTemperatureSetpoint", temp.orElse(20.0));
                    state.put("thermostatMode", mode.orElse("heat"));
                    break;
                case "FanSpeed":
                    // Query fan speed
                    Optional<String> fanSpeed = getLatestStringValue(tenantId, deviceId, "fanSpeed");
                    state.put("fanSpeed", fanSpeed.orElse("medium"));
                    break;
                case "LockUnlock":
                    // Query lock state
                    Optional<Boolean> locked = getLatestBooleanValue(tenantId, deviceId, "locked");
                    state.put("isLocked", locked.orElse(false));
                    break;
            }
        } catch (Exception e) {
            log.error("Error querying trait state for trait {}: {}", trait, e.getMessage(), e);
        }

        return state;
    }

    private Optional<Boolean> getLatestBooleanValue(TenantId tenantId, DeviceId deviceId, String key) {
        try {
            // Try getting from latest telemetry first
            ReadTsKvQuery query = new BaseReadTsKvQuery(key, System.currentTimeMillis() - TimeUnit.DAYS.toMillis(1),
                System.currentTimeMillis(), 1, "DESC");
            List<TsKvEntry> tsKvEntries = timeseriesService.findAll(tenantId, deviceId, Collections.singletonList(query)).get();

            if (!tsKvEntries.isEmpty()) {
                return Optional.of(tsKvEntries.get(0).getBooleanValue().orElse(false));
            }

            // Fallback to attributes
            List<AttributeKvEntry> attributes = attributesService.find(tenantId, deviceId, AttributeScope.CLIENT_SCOPE, Collections.singletonList(key)).get();
            if (!attributes.isEmpty()) {
                return Optional.of(attributes.get(0).getBooleanValue().orElse(false));
            }
        } catch (Exception e) {
            log.error("Error getting boolean value for key {}: {}", key, e.getMessage());
        }
        return Optional.empty();
    }

    private Optional<Integer> getLatestIntValue(TenantId tenantId, DeviceId deviceId, String key) {
        try {
            ReadTsKvQuery query = new BaseReadTsKvQuery(key, System.currentTimeMillis() - TimeUnit.DAYS.toMillis(1),
                System.currentTimeMillis(), 1, "DESC");
            List<TsKvEntry> tsKvEntries = timeseriesService.findAll(tenantId, deviceId, Collections.singletonList(query)).get();

            if (!tsKvEntries.isEmpty()) {
                return Optional.of(tsKvEntries.get(0).getLongValue().orElse(0L).intValue());
            }

            List<AttributeKvEntry> attributes = attributesService.find(tenantId, deviceId, AttributeScope.CLIENT_SCOPE, Collections.singletonList(key)).get();
            if (!attributes.isEmpty()) {
                return Optional.of(attributes.get(0).getLongValue().orElse(0L).intValue());
            }
        } catch (Exception e) {
            log.error("Error getting int value for key {}: {}", key, e.getMessage());
        }
        return Optional.empty();
    }

    private Optional<Double> getLatestDoubleValue(TenantId tenantId, DeviceId deviceId, String key) {
        try {
            ReadTsKvQuery query = new BaseReadTsKvQuery(key, System.currentTimeMillis() - TimeUnit.DAYS.toMillis(1),
                System.currentTimeMillis(), 1, "DESC");
            List<TsKvEntry> tsKvEntries = timeseriesService.findAll(tenantId, deviceId, Collections.singletonList(query)).get();

            if (!tsKvEntries.isEmpty()) {
                return Optional.of(tsKvEntries.get(0).getDoubleValue().orElse(0.0));
            }

            List<AttributeKvEntry> attributes = attributesService.find(tenantId, deviceId, AttributeScope.CLIENT_SCOPE, Collections.singletonList(key)).get();
            if (!attributes.isEmpty()) {
                return Optional.of(attributes.get(0).getDoubleValue().orElse(0.0));
            }
        } catch (Exception e) {
            log.error("Error getting double value for key {}: {}", key, e.getMessage());
        }
        return Optional.empty();
    }

    private Optional<String> getLatestStringValue(TenantId tenantId, DeviceId deviceId, String key) {
        try {
            ReadTsKvQuery query = new BaseReadTsKvQuery(key, System.currentTimeMillis() - TimeUnit.DAYS.toMillis(1),
                System.currentTimeMillis(), 1, "DESC");
            List<TsKvEntry> tsKvEntries = timeseriesService.findAll(tenantId, deviceId, Collections.singletonList(query)).get();

            if (!tsKvEntries.isEmpty()) {
                return Optional.of(tsKvEntries.get(0).getValueAsString());
            }

            List<AttributeKvEntry> attributes = attributesService.find(tenantId, deviceId, AttributeScope.CLIENT_SCOPE, Collections.singletonList(key)).get();
            if (!attributes.isEmpty()) {
                return Optional.of(attributes.get(0).getValueAsString());
            }
        } catch (Exception e) {
            log.error("Error getting string value for key {}: {}", key, e.getMessage());
        }
        return Optional.empty();
    }
}
