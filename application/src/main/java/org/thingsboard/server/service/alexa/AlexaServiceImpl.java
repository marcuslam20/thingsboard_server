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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thingsboard.server.common.data.AttributeScope;
import org.thingsboard.server.common.data.Device;
import org.thingsboard.server.common.data.DeviceProfile;
import org.thingsboard.server.common.data.User;
import org.thingsboard.server.common.data.id.CustomerId;
import org.thingsboard.server.common.data.id.DeviceId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.common.data.kv.AttributeKvEntry;
import org.thingsboard.server.common.data.kv.BaseAttributeKvEntry;
import org.thingsboard.server.common.data.kv.BooleanDataEntry;
import org.thingsboard.server.common.data.kv.DoubleDataEntry;
import org.thingsboard.server.common.data.kv.LongDataEntry;
import org.thingsboard.server.common.data.kv.StringDataEntry;
import org.thingsboard.server.common.data.security.Authority;
import org.thingsboard.server.common.data.page.PageData;
import org.thingsboard.server.common.data.page.PageLink;
import org.thingsboard.server.common.data.smarthome.DataPoint;
import org.thingsboard.server.common.data.smarthome.DpMode;
import org.thingsboard.server.common.data.smarthome.DpType;
import org.thingsboard.server.dao.attributes.AttributesService;
import org.thingsboard.server.dao.device.DeviceProfileService;
import org.thingsboard.server.dao.device.DeviceService;
import org.thingsboard.server.dao.smarthome.DataPointService;
import org.thingsboard.server.dao.user.UserService;
import org.thingsboard.server.service.alexa.dto.AlexaCapabilities;
import org.thingsboard.server.service.alexa.dto.AlexaCommand;
import org.thingsboard.server.service.alexa.dto.AlexaDevice;
import org.thingsboard.server.service.rpc.TbCoreDeviceRpcService;
import org.thingsboard.server.common.data.rpc.ToDeviceRpcRequestBody;
import org.thingsboard.server.common.msg.rpc.ToDeviceRpcRequest;

import java.util.*;
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
    private final DataPointService dataPointService;
    private final AttributesService attributesService;
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

        // Try DP-based execution first
        List<DataPoint> dataPoints = dataPointService.findDataPointsByDeviceProfileId(device.getDeviceProfileId());
        if (dataPoints != null && !dataPoints.isEmpty()) {
            executeDpCommand(tenantId, device, command, dataPoints);
            return;
        }

        // Fallback: legacy hardcoded RPC mapping
        log.debug("No DPs found for device profile {}, using legacy RPC mapping", device.getDeviceProfileId());
        executeLegacyCommand(tenantId, device, command);
    }

    /**
     * DP-based command execution for Alexa.
     * Maps Alexa command to DP codes and sends via setDps RPC.
     */
    private void executeDpCommand(TenantId tenantId, Device device, AlexaCommand command, List<DataPoint> dataPoints) {
        String cmd = command.getCommand().toLowerCase();

        // Build writable DP lookup
        Map<String, DataPoint> dpByCode = new LinkedHashMap<>();
        Map<DpType, List<DataPoint>> dpByType = new HashMap<>();
        for (DataPoint dp : dataPoints) {
            if (dp.getMode() != DpMode.RO) {
                dpByCode.put(dp.getCode(), dp);
                dpByType.computeIfAbsent(dp.getDpType(), k -> new ArrayList<>()).add(dp);
            }
        }

        Map<String, Object> dpValues = new LinkedHashMap<>();

        switch (cmd) {
            case "setpower":
            case "turnon":
            case "turnoff": {
                boolean on = cmd.equals("turnon") || (command.getValue() != null &&
                        (Boolean.parseBoolean(command.getValue().toString()) ||
                         "on".equalsIgnoreCase(command.getValue().toString())));

                // Look for BOOLEAN switch DPs first
                DataPoint switchDp = findDpByCode(dpByCode, "switch", "switch_led", "switch_1");
                if (switchDp != null && switchDp.getDpType() == DpType.BOOLEAN) {
                    dpValues.put(switchDp.getCode(), on);
                } else {
                    // ENUM control DP (e.g., curtain open/close)
                    DataPoint controlDp = findDpByCode(dpByCode, "control", "curtain_control", "mach_operate");
                    if (controlDp != null && controlDp.getDpType() == DpType.ENUM) {
                        dpValues.put(controlDp.getCode(), on ? "open" : "close");
                    } else {
                        // Fallback: first BOOLEAN DP
                        List<DataPoint> boolDps = dpByType.getOrDefault(DpType.BOOLEAN, Collections.emptyList());
                        if (!boolDps.isEmpty()) {
                            dpValues.put(boolDps.get(0).getCode(), on);
                        }
                    }
                }
                break;
            }
            case "setbrightness": {
                int brightness = command.getValue() != null ? Integer.parseInt(command.getValue().toString()) : 0;
                DataPoint brightDp = findDpByCode(dpByCode, "bright_value", "bright_value_v2", "brightness");
                if (brightDp != null) {
                    brightness = scaleValue(brightness, 0, 100, brightDp);
                    dpValues.put(brightDp.getCode(), brightness);
                }
                break;
            }
            case "setpercentage": {
                int percent = command.getValue() != null ? Integer.parseInt(command.getValue().toString()) : 0;
                DataPoint percentDp = findDpByCode(dpByCode, "percent_control", "position", "percent_state");
                if (percentDp != null) {
                    percent = scaleValue(percent, 0, 100, percentDp);
                    dpValues.put(percentDp.getCode(), percent);
                } else {
                    // Try brightness DP for lights
                    DataPoint brightDp = findDpByCode(dpByCode, "bright_value", "bright_value_v2", "brightness");
                    if (brightDp != null) {
                        percent = scaleValue(percent, 0, 100, brightDp);
                        dpValues.put(brightDp.getCode(), percent);
                    }
                }
                break;
            }
            case "settemperature": {
                double temp = command.getValue() != null ? Double.parseDouble(command.getValue().toString()) : 20;
                DataPoint tempDp = findDpByCode(dpByCode, "temp_set", "temperature_set", "set_temp");
                if (tempDp != null) {
                    int scaledTemp = scaleValue((int)(temp * 10), 0, 600, tempDp);
                    dpValues.put(tempDp.getCode(), scaledTemp);
                }
                break;
            }
            case "setcolor": {
                if (command.getValue() != null) {
                    DataPoint colorDp = findDpByCode(dpByCode, "colour_data", "colour_data_v2");
                    if (colorDp != null) {
                        // Alexa sends color as { hue, saturation, brightness }
                        try {
                            JsonNode colorNode = command.getValue() instanceof JsonNode
                                    ? (JsonNode) command.getValue()
                                    : objectMapper.readTree(command.getValue().toString());
                            int h = colorNode.path("hue").asInt();
                            int s = (int)(colorNode.path("saturation").asDouble() * 1000);
                            int v = (int)(colorNode.path("brightness").asDouble() * 1000);
                            dpValues.put(colorDp.getCode(), String.format("{\"h\":%d,\"s\":%d,\"v\":%d}", h, s, v));
                        } catch (Exception e) {
                            log.error("Failed to parse Alexa color value: {}", command.getValue());
                        }
                    }
                }
                break;
            }
            case "setcolortemperature": {
                if (command.getValue() != null) {
                    int tempK = Integer.parseInt(command.getValue().toString());
                    DataPoint tempDp = findDpByCode(dpByCode, "temp_value", "temp_value_v2", "colour_temp");
                    if (tempDp != null) {
                        tempK = scaleValue(tempK, 2000, 6500, tempDp);
                        dpValues.put(tempDp.getCode(), tempK);
                    }
                }
                break;
            }
            case "setlock":
            case "lock":
            case "unlock": {
                boolean lock = cmd.equals("lock") || (command.getValue() != null &&
                        Boolean.parseBoolean(command.getValue().toString()));
                DataPoint lockDp = findDpByCode(dpByCode, "switch_lock", "lock", "child_lock");
                if (lockDp != null) {
                    dpValues.put(lockDp.getCode(), lock);
                }
                break;
            }
            default:
                log.warn("Unhandled Alexa command for DP mapping: {}", cmd);
                // Fallback to legacy
                executeLegacyCommand(tenantId, device, command);
                return;
        }

        if (dpValues.isEmpty()) {
            log.warn("No DP mapping found for Alexa command {} on device {}", cmd, device.getId());
            executeLegacyCommand(tenantId, device, command);
            return;
        }

        // Build RPC params keyed by dpId
        ObjectNode rpcParams = objectMapper.createObjectNode();
        List<AttributeKvEntry> attrsToSave = new ArrayList<>();
        long now = System.currentTimeMillis();

        for (Map.Entry<String, Object> entry : dpValues.entrySet()) {
            DataPoint dp = dpByCode.get(entry.getKey());
            if (dp == null) continue;

            rpcParams.set(String.valueOf(dp.getDpId()), objectMapper.valueToTree(entry.getValue()));

            // Save as shared attribute
            AttributeKvEntry attr = createAttributeKvEntry(entry.getKey(), entry.getValue(), now);
            if (attr != null) attrsToSave.add(attr);
        }

        // Save shared attributes
        if (!attrsToSave.isEmpty()) {
            try {
                attributesService.save(tenantId, device.getId(), AttributeScope.SHARED_SCOPE, attrsToSave);
                log.info("Saved {} DP values as shared attributes for device {}", attrsToSave.size(), device.getId());
            } catch (Exception e) {
                log.error("Failed to save shared attributes for device {}: {}", device.getId(), e.getMessage());
            }
        }

        log.info("Sending DP command to device {} via Alexa: {}", device.getId(), rpcParams);
        sendRpcCommand(tenantId, device, "setDps", rpcParams);
    }

    /**
     * Legacy command execution for devices without DP definitions.
     */
    private void executeLegacyCommand(TenantId tenantId, Device device, AlexaCommand command) {
        String method;
        ObjectNode params = objectMapper.createObjectNode();

        switch (command.getCommand().toLowerCase()) {
            case "setpower":
            case "turnon":
            case "turnoff":
                method = "setPower";
                boolean on = "turnon".equalsIgnoreCase(command.getCommand()) ||
                        (command.getValue() != null &&
                        (Boolean.parseBoolean(command.getValue().toString()) ||
                         "on".equalsIgnoreCase(command.getValue().toString())));
                params.put("state", on);
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
                method = command.getCommand();
                if (command.getValue() != null) {
                    params.putPOJO("value", command.getValue());
                }
        }

        sendRpcCommand(tenantId, device, method, params);
        log.info("Executed legacy Alexa command {} on device {}", command.getCommand(), device.getId());
    }

    // ========== DP Helper Methods ==========

    private DataPoint findDpByCode(Map<String, DataPoint> dpByCode, String... patterns) {
        for (String pattern : patterns) {
            DataPoint dp = dpByCode.get(pattern);
            if (dp != null) return dp;
        }
        return null;
    }

    private int scaleValue(int value, int srcMin, int srcMax, DataPoint dp) {
        JsonNode constraints = dp.getConstraints();
        if (constraints == null || !constraints.has("min") || !constraints.has("max")) return value;
        int dpMin = constraints.get("min").asInt();
        int dpMax = constraints.get("max").asInt();
        if (srcMin == dpMin && srcMax == dpMax) return value;
        double ratio = (double)(value - srcMin) / (srcMax - srcMin);
        return (int)(dpMin + ratio * (dpMax - dpMin));
    }

    private AttributeKvEntry createAttributeKvEntry(String key, Object value, long ts) {
        if (value instanceof Boolean) {
            return new BaseAttributeKvEntry(new BooleanDataEntry(key, (Boolean) value), ts);
        } else if (value instanceof Integer || value instanceof Long) {
            return new BaseAttributeKvEntry(new LongDataEntry(key, ((Number) value).longValue()), ts);
        } else if (value instanceof Double || value instanceof Float) {
            return new BaseAttributeKvEntry(new DoubleDataEntry(key, ((Number) value).doubleValue()), ts);
        } else if (value instanceof String) {
            return new BaseAttributeKvEntry(new StringDataEntry(key, (String) value), ts);
        }
        return new BaseAttributeKvEntry(new StringDataEntry(key, String.valueOf(value)), ts);
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
