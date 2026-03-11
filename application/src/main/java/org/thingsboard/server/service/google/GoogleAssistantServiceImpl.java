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
import org.thingsboard.server.common.data.DeviceProfile;
import org.thingsboard.server.common.data.User;
import org.thingsboard.server.common.data.id.CustomerId;
import org.thingsboard.server.common.data.id.DeviceId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.common.data.kv.AttributeKvEntry;
import org.thingsboard.server.common.data.kv.BaseAttributeKvEntry;
import org.thingsboard.server.common.data.kv.BaseReadTsKvQuery;
import org.thingsboard.server.common.data.kv.BooleanDataEntry;
import org.thingsboard.server.common.data.kv.DoubleDataEntry;
import org.thingsboard.server.common.data.kv.LongDataEntry;
import org.thingsboard.server.common.data.kv.ReadTsKvQuery;
import org.thingsboard.server.common.data.kv.StringDataEntry;
import org.thingsboard.server.common.data.kv.TsKvEntry;
import org.thingsboard.server.common.data.page.PageData;
import org.thingsboard.server.common.data.page.PageLink;
import org.thingsboard.server.common.data.rpc.ToDeviceRpcRequestBody;
import org.thingsboard.server.common.data.smarthome.DataPoint;
import org.thingsboard.server.common.data.smarthome.DpMode;
import org.thingsboard.server.common.data.smarthome.DpType;
import org.thingsboard.server.common.data.smarthome.ProductCategory;
import org.thingsboard.server.common.msg.rpc.ToDeviceRpcRequest;
import org.thingsboard.server.dao.attributes.AttributesService;
import org.thingsboard.server.dao.device.DeviceProfileService;
import org.thingsboard.server.dao.device.DeviceService;
import org.thingsboard.server.dao.smarthome.DataPointService;
import org.thingsboard.server.dao.smarthome.ProductCategoryService;
import org.thingsboard.server.dao.timeseries.TimeseriesService;
import org.thingsboard.server.dao.user.UserService;
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
    private final DeviceProfileService deviceProfileService;
    private final AttributesService attributesService;
    private final TimeseriesService timeseriesService;
    private final TbCoreDeviceRpcService deviceRpcService;
    private final UserService userService;
    private final DataPointService dataPointService;
    private final ProductCategoryService productCategoryService;
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
    public List<GoogleDevice> getGoogleEnabledDevicesForUser(TenantId tenantId, UserId userId) {
        log.debug("Getting Google-enabled devices for tenant: {}, user: {}", tenantId, userId);

        // Get user to check role/authority
        User user = userService.findUserById(tenantId, userId);
        if (user == null) {
            log.warn("User not found: {}", userId);
            return Collections.emptyList();
        }

        // Get all Google-enabled devices for tenant
        List<GoogleDevice> allDevices = getGoogleEnabledDevices(tenantId);

        // If user is tenant admin, return all devices
        if (user.getAuthority().name().equals("TENANT_ADMIN")) {
            log.debug("User is tenant admin, returning all {} devices", allDevices.size());
            return allDevices;
        }

        // If user is customer user, filter by customer
        CustomerId customerId = user.getCustomerId();
        if (customerId == null || customerId.isNullUid()) {
            log.warn("Customer user {} has no customerId, returning empty list", userId);
            return Collections.emptyList();
        }

        // Filter devices by customerId
        List<GoogleDevice> customerDevices = new ArrayList<>();
        for (GoogleDevice googleDevice : allDevices) {
            Device device = deviceService.findDeviceById(tenantId, new DeviceId(googleDevice.getId()));
            if (device != null && device.getCustomerId() != null && device.getCustomerId().equals(customerId)) {
                customerDevices.add(googleDevice);
            }
        }

        log.debug("Found {} Google-enabled devices for customer user {}", customerDevices.size(), userId);
        return customerDevices;
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

        // Try DP-based execution first if device has DP definitions
        List<DataPoint> dataPoints = dataPointService.findDataPointsByDeviceProfileId(device.getDeviceProfileId());
        if (dataPoints != null && !dataPoints.isEmpty()) {
            executeDpCommand(device, command, dataPoints);
            return;
        }

        // Fallback: legacy hardcoded RPC mapping for devices without DPs
        log.debug("No DPs found for device profile {}, using legacy RPC mapping", device.getDeviceProfileId());
        executeLegacyCommand(device, command);
    }

    /**
     * DP-based command execution.
     * Maps Google command params to matching DP codes and sends via setDps RPC.
     * Also saves values as shared attributes for status query.
     */
    private void executeDpCommand(Device device, GoogleCommand command, List<DataPoint> dataPoints) {
        String googleCommand = command.getCommand().replace("action.devices.commands.", "");
        JsonNode params = command.getParams();

        // Map Google command to DP values
        Map<String, Object> dpValues = mapGoogleCommandToDpValues(googleCommand, params, dataPoints);

        if (dpValues.isEmpty()) {
            log.warn("No DP mapping found for Google command {} on device {}", googleCommand, device.getId());
            // Fallback to legacy
            executeLegacyCommand(device, command);
            return;
        }

        // Build RPC params: { "1": true, "2": 50 } keyed by dpId
        ObjectNode rpcParams = objectMapper.createObjectNode();
        List<AttributeKvEntry> attrsToSave = new ArrayList<>();
        long now = System.currentTimeMillis();

        for (Map.Entry<String, Object> entry : dpValues.entrySet()) {
            String dpCode = entry.getKey();
            Object value = entry.getValue();

            // Find the DP by code to get dpId
            DataPoint dp = dataPoints.stream()
                    .filter(d -> d.getCode().equals(dpCode))
                    .findFirst().orElse(null);
            if (dp == null) continue;

            // Check mode allows writing
            if (dp.getMode() == DpMode.RO) {
                log.warn("DP {} ({}) is read-only, skipping", dp.getDpId(), dp.getCode());
                continue;
            }

            // Add to RPC params keyed by dpId
            rpcParams.set(String.valueOf(dp.getDpId()), objectMapper.valueToTree(value));

            // Save as shared attribute for status API
            AttributeKvEntry attr = createAttributeKvEntry(dpCode, value, now);
            if (attr != null) {
                attrsToSave.add(attr);
            }
        }

        if (rpcParams.isEmpty()) {
            log.warn("No writable DP values for command on device {}", device.getId());
            return;
        }

        // Save shared attributes
        if (!attrsToSave.isEmpty()) {
            try {
                attributesService.save(device.getTenantId(), device.getId(), AttributeScope.SHARED_SCOPE, attrsToSave);
                log.info("Saved {} DP values as shared attributes for device {}", attrsToSave.size(), device.getId());
            } catch (Exception e) {
                log.error("Failed to save shared attributes for device {}: {}", device.getId(), e.getMessage());
            }
        }

        // Send RPC with setDps method and 3s timeout
        ObjectNode rpcBody = objectMapper.createObjectNode();
        rpcBody.put("method", "setDps");
        rpcBody.put("timeout", 3000);
        rpcBody.set("params", rpcParams);

        log.info("Sending DP command to device {} via Google Assistant: {}", device.getId(), rpcParams);
        sendRpcCommand(device, "setDps", rpcParams);
    }

    /**
     * Map Google command + params to DP code → value pairs by matching DP definitions.
     */
    private Map<String, Object> mapGoogleCommandToDpValues(String googleCommand, JsonNode params, List<DataPoint> dataPoints) {
        Map<String, Object> dpValues = new LinkedHashMap<>();

        // Build lookup maps for quick DP search
        Map<String, DataPoint> dpByCode = new LinkedHashMap<>();
        Map<DpType, List<DataPoint>> dpByType = new HashMap<>();
        for (DataPoint dp : dataPoints) {
            if (dp.getMode() != DpMode.RO) {
                dpByCode.put(dp.getCode(), dp);
                dpByType.computeIfAbsent(dp.getDpType(), k -> new ArrayList<>()).add(dp);
            }
        }

        switch (googleCommand) {
            case "OnOff": {
                boolean on = params.has("on") && params.get("on").asBoolean();
                // Look for BOOLEAN switch DPs first (switch, switch_led, switch_1)
                DataPoint switchDp = findDpByCodePattern(dpByCode, "switch", "switch_led", "switch_1");
                if (switchDp != null && switchDp.getDpType() == DpType.BOOLEAN) {
                    dpValues.put(switchDp.getCode(), on);
                } else {
                    // Check for ENUM control DP (e.g., curtain with open/close/stop)
                    DataPoint controlDp = findDpByCodePattern(dpByCode, "control", "curtain_control", "mach_operate");
                    if (controlDp != null && controlDp.getDpType() == DpType.ENUM) {
                        dpValues.put(controlDp.getCode(), on ? "open" : "close");
                    } else {
                        // Fallback: first BOOLEAN DP that is writable
                        List<DataPoint> boolDps = dpByType.getOrDefault(DpType.BOOLEAN, Collections.emptyList());
                        if (!boolDps.isEmpty()) {
                            dpValues.put(boolDps.get(0).getCode(), on);
                        }
                    }
                }
                break;
            }
            case "BrightnessAbsolute": {
                int brightness = params.has("brightness") ? params.get("brightness").asInt() : 0;
                // Look for brightness DP (VALUE type, typically 10-1000 range)
                DataPoint brightDp = findDpByCodePattern(dpByCode, "bright_value", "bright_value_v2", "brightness");
                if (brightDp != null) {
                    // Scale Google brightness (0-100) to DP range
                    brightness = scaleValueToConstraints(brightness, 0, 100, brightDp);
                    dpValues.put(brightDp.getCode(), brightness);
                }
                break;
            }
            case "ColorAbsolute": {
                if (params.has("color")) {
                    JsonNode color = params.get("color");
                    if (color.has("temperature")) {
                        int tempK = color.get("temperature").asInt();
                        DataPoint tempDp = findDpByCodePattern(dpByCode, "temp_value", "temp_value_v2", "colour_temp");
                        if (tempDp != null) {
                            // Scale Kelvin (2000-6500) to DP range
                            tempK = scaleValueToConstraints(tempK, 2000, 6500, tempDp);
                            dpValues.put(tempDp.getCode(), tempK);
                        }
                    }
                    if (color.has("spectrumRGB")) {
                        int rgb = color.get("spectrumRGB").asInt();
                        DataPoint colorDp = findDpByCodePattern(dpByCode, "colour_data", "colour_data_v2");
                        if (colorDp != null) {
                            // Convert RGB int to HSV JSON string that Tuya expects
                            dpValues.put(colorDp.getCode(), rgbToTuyaColorString(rgb));
                        }
                    }
                }
                break;
            }
            case "OpenClose": {
                int openPercent = params.has("openPercent") ? params.get("openPercent").asInt() : 0;
                // Look for curtain control DPs
                DataPoint controlDp = findDpByCodePattern(dpByCode, "control", "curtain_control", "mach_operate");
                DataPoint percentDp = findDpByCodePattern(dpByCode, "percent_control", "position", "percent_state");

                if (openPercent == 0 || openPercent == 100) {
                    // Simple open/close → use ENUM control DP (e.g., dpId=1, "open"/"close")
                    if (controlDp != null) {
                        String controlValue = openPercent > 0 ? "open" : "close";
                        dpValues.put(controlDp.getCode(), controlValue);
                    } else if (percentDp != null) {
                        // Fallback to percent if no control DP
                        dpValues.put(percentDp.getCode(), scaleValueToConstraints(openPercent, 0, 100, percentDp));
                    }
                } else {
                    // Partial open (1-99%) → use VALUE percent DP (e.g., dpId=2)
                    if (percentDp != null) {
                        dpValues.put(percentDp.getCode(), scaleValueToConstraints(openPercent, 0, 100, percentDp));
                    } else if (controlDp != null) {
                        // No percent DP, approximate with open/close
                        dpValues.put(controlDp.getCode(), "open");
                    }
                }
                break;
            }
            case "ThermostatTemperatureSetpoint": {
                double temp = params.has("thermostatTemperatureSetpoint") ? params.get("thermostatTemperatureSetpoint").asDouble() : 20;
                DataPoint tempDp = findDpByCodePattern(dpByCode, "temp_set", "temperature_set", "set_temp");
                if (tempDp != null) {
                    // Tuya thermostats often use integer (multiply by 10)
                    int scaledTemp = scaleValueToConstraints((int)(temp * 10), 0, 600, tempDp);
                    dpValues.put(tempDp.getCode(), scaledTemp);
                }
                break;
            }
            case "ThermostatSetMode": {
                String mode = params.has("thermostatMode") ? params.get("thermostatMode").asText() : "heat";
                DataPoint modeDp = findDpByCodePattern(dpByCode, "mode", "work_mode");
                if (modeDp != null) {
                    dpValues.put(modeDp.getCode(), mode);
                }
                break;
            }
            case "SetFanSpeed": {
                String speed = params.has("fanSpeed") ? params.get("fanSpeed").asText() : "medium";
                DataPoint speedDp = findDpByCodePattern(dpByCode, "fan_speed", "speed", "fan_speed_enum");
                if (speedDp != null) {
                    dpValues.put(speedDp.getCode(), speed);
                }
                break;
            }
            case "LockUnlock": {
                boolean lock = params.has("lock") && params.get("lock").asBoolean();
                DataPoint lockDp = findDpByCodePattern(dpByCode, "switch_lock", "lock", "child_lock");
                if (lockDp != null) {
                    dpValues.put(lockDp.getCode(), lock);
                }
                break;
            }
            default:
                log.warn("Unhandled Google command for DP mapping: {}", googleCommand);
        }

        return dpValues;
    }

    /**
     * Find a DP by trying multiple code patterns in order.
     */
    private DataPoint findDpByCodePattern(Map<String, DataPoint> dpByCode, String... patterns) {
        for (String pattern : patterns) {
            DataPoint dp = dpByCode.get(pattern);
            if (dp != null) return dp;
        }
        return null;
    }

    /**
     * Scale a value from source range to DP constraint range.
     */
    private int scaleValueToConstraints(int value, int srcMin, int srcMax, DataPoint dp) {
        JsonNode constraints = dp.getConstraints();
        if (constraints == null || !constraints.has("min") || !constraints.has("max")) {
            return value;
        }
        int dpMin = constraints.get("min").asInt();
        int dpMax = constraints.get("max").asInt();

        if (srcMin == dpMin && srcMax == dpMax) {
            return value;
        }

        // Linear interpolation
        double ratio = (double)(value - srcMin) / (srcMax - srcMin);
        return (int)(dpMin + ratio * (dpMax - dpMin));
    }

    /**
     * Convert RGB integer to Tuya-style HSV color JSON string.
     */
    private String rgbToTuyaColorString(int rgb) {
        int r = (rgb >> 16) & 0xFF;
        int g = (rgb >> 8) & 0xFF;
        int b = rgb & 0xFF;

        float[] hsb = java.awt.Color.RGBtoHSB(r, g, b, null);
        int h = Math.round(hsb[0] * 360);
        int s = Math.round(hsb[1] * 1000);
        int v = Math.round(hsb[2] * 1000);

        return String.format("{\"h\":%d,\"s\":%d,\"v\":%d}", h, s, v);
    }

    /**
     * Create an AttributeKvEntry from a DP code and value.
     */
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

    /**
     * Legacy command execution for devices without DP definitions.
     * Keeps backward compatibility with existing rpcMapping approach.
     */
    private void executeLegacyCommand(Device device, GoogleCommand command) {
        GoogleCapabilities capabilities = getDeviceCapabilities(device);

        String standardRpcMethod = mapCommandToRpcMethod(command.getCommand());
        ObjectNode standardRpcParams = mapCommandParams(command.getCommand(), command.getParams());

        String finalRpcMethod = standardRpcMethod;
        JsonNode finalRpcParams = standardRpcParams;

        if (capabilities != null && capabilities.getRpcMapping() != null) {
            GoogleCapabilities.RpcMethodMapping customMapping = capabilities.getRpcMapping().get(standardRpcMethod);
            if (customMapping != null) {
                log.debug("Applying custom RPC mapping for method: {}", standardRpcMethod);
                finalRpcMethod = customMapping.getMethod();
                finalRpcParams = applyCustomParamMapping(standardRpcParams, customMapping);
            }
        }

        try {
            sendRpcCommand(device, finalRpcMethod, finalRpcParams);
            log.debug("Legacy command executed successfully on device: {}", device.getId());
        } catch (Exception e) {
            log.error("Error executing legacy command on device {}: {}", device.getId(), e.getMessage(), e);
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

        // Try DP-based state query first
        List<DataPoint> dataPoints = dataPointService.findDataPointsByDeviceProfileId(device.getDeviceProfileId());
        if (dataPoints != null && !dataPoints.isEmpty()) {
            Map<String, Object> dpState = queryDpBasedState(tenantId, deviceId, dataPoints, googleDevice);
            dpState.forEach(state::addStateProperty);
        } else {
            // Fallback: legacy trait-based query
            List<String> traits = googleDevice.getGoogleCapabilities().getTraits();
            if (traits != null) {
                for (String trait : traits) {
                    Map<String, Object> traitState = queryTraitState(tenantId, deviceId, trait);
                    traitState.forEach(state::addStateProperty);
                }
            }
        }

        log.debug("Device state queried successfully for device: {}", deviceId);
        return state;
    }

    /**
     * Query device state from DP definitions + attributes.
     * Reads shared and client attributes, maps DP codes to Google trait states.
     */
    private Map<String, Object> queryDpBasedState(TenantId tenantId, DeviceId deviceId,
                                                   List<DataPoint> dataPoints, GoogleDevice googleDevice) {
        Map<String, Object> googleState = new HashMap<>();

        // Read all attributes (shared first, client overrides)
        Map<String, Object> attrMap = new HashMap<>();
        try {
            List<AttributeKvEntry> sharedAttrs = attributesService.findAll(tenantId, deviceId, AttributeScope.SHARED_SCOPE).get();
            for (AttributeKvEntry entry : sharedAttrs) {
                attrMap.put(entry.getKey(), getKvValue(entry));
            }
            List<AttributeKvEntry> clientAttrs = attributesService.findAll(tenantId, deviceId, AttributeScope.CLIENT_SCOPE).get();
            for (AttributeKvEntry entry : clientAttrs) {
                attrMap.put(entry.getKey(), getKvValue(entry));
            }
        } catch (Exception e) {
            log.error("Failed to read attributes for device {}: {}", deviceId, e.getMessage());
            return googleState;
        }

        // Build DP code → value lookup
        Map<String, Object> dpValueMap = new HashMap<>();
        for (DataPoint dp : dataPoints) {
            Object value = attrMap.get(dp.getCode());
            if (value == null) value = attrMap.get("dp_" + dp.getDpId());
            if (value == null) value = attrMap.get(String.valueOf(dp.getDpId()));
            if (value != null) {
                dpValueMap.put(dp.getCode(), value);
            }
        }

        // Map DP values to Google trait states based on configured traits
        List<String> traits = googleDevice.getGoogleCapabilities() != null
                ? googleDevice.getGoogleCapabilities().getTraits() : Collections.emptyList();

        for (String trait : traits) {
            String cleanTrait = trait.replace("action.devices.traits.", "");
            switch (cleanTrait) {
                case "OnOff": {
                    // Look for switch DP
                    Object val = findDpValue(dpValueMap, "switch", "switch_led", "switch_1", "control");
                    if (val instanceof Boolean) {
                        googleState.put("on", val);
                    } else if (val instanceof Number) {
                        googleState.put("on", ((Number) val).intValue() != 0);
                    } else {
                        googleState.put("on", false);
                    }
                    break;
                }
                case "Brightness": {
                    Object val = findDpValue(dpValueMap, "bright_value", "bright_value_v2", "brightness");
                    if (val instanceof Number) {
                        // Find the DP to get constraints for reverse scaling
                        DataPoint dp = findDpByCodeInList(dataPoints, "bright_value", "bright_value_v2", "brightness");
                        int rawVal = ((Number) val).intValue();
                        int brightness = dp != null ? reverseScaleValue(rawVal, 0, 100, dp) : rawVal;
                        googleState.put("brightness", brightness);
                    } else {
                        googleState.put("brightness", 0);
                    }
                    break;
                }
                case "ColorSetting": {
                    Object colorVal = findDpValue(dpValueMap, "colour_data", "colour_data_v2");
                    if (colorVal instanceof String) {
                        Integer rgb = tuyaColorStringToRgb((String) colorVal);
                        if (rgb != null) {
                            Map<String, Object> colorData = new HashMap<>();
                            colorData.put("spectrumRgb", rgb);
                            googleState.put("color", colorData);
                        }
                    }
                    Object tempVal = findDpValue(dpValueMap, "temp_value", "temp_value_v2", "colour_temp");
                    if (tempVal instanceof Number) {
                        DataPoint dp = findDpByCodeInList(dataPoints, "temp_value", "temp_value_v2", "colour_temp");
                        int rawTemp = ((Number) tempVal).intValue();
                        int tempK = dp != null ? reverseScaleValue(rawTemp, 2000, 6500, dp) : rawTemp;
                        Map<String, Object> colorData = (Map<String, Object>) googleState.getOrDefault("color", new HashMap<>());
                        colorData.put("temperatureK", tempK);
                        googleState.put("color", colorData);
                    }
                    break;
                }
                case "OpenClose": {
                    Object val = findDpValue(dpValueMap, "percent_control", "position", "percent_state");
                    if (val instanceof Number) {
                        googleState.put("openPercent", ((Number) val).intValue());
                    } else {
                        // Check enum control DP for open/close state
                        Object controlVal = findDpValue(dpValueMap, "control", "curtain_control", "mach_operate");
                        if (controlVal != null) {
                            googleState.put("openPercent", "open".equals(String.valueOf(controlVal)) ? 100 : 0);
                        } else {
                            googleState.put("openPercent", 0);
                        }
                    }
                    break;
                }
                case "TemperatureSetting": {
                    Object tempVal = findDpValue(dpValueMap, "temp_set", "temperature_set", "set_temp");
                    if (tempVal instanceof Number) {
                        // Reverse scale (DP might be *10)
                        double temp = ((Number) tempVal).doubleValue();
                        DataPoint dp = findDpByCodeInList(dataPoints, "temp_set", "temperature_set", "set_temp");
                        if (dp != null && dp.getConstraints() != null && dp.getConstraints().has("max") && dp.getConstraints().get("max").asInt() > 100) {
                            temp = temp / 10.0; // DP is likely in 0.1 degree units
                        }
                        googleState.put("thermostatTemperatureSetpoint", temp);
                    } else {
                        googleState.put("thermostatTemperatureSetpoint", 20.0);
                    }
                    Object modeVal = findDpValue(dpValueMap, "mode", "work_mode");
                    googleState.put("thermostatMode", modeVal != null ? String.valueOf(modeVal) : "heat");
                    break;
                }
                case "FanSpeed": {
                    Object val = findDpValue(dpValueMap, "fan_speed", "speed", "fan_speed_enum");
                    googleState.put("currentFanSpeedSetting", val != null ? String.valueOf(val) : "medium");
                    break;
                }
                case "LockUnlock": {
                    Object val = findDpValue(dpValueMap, "switch_lock", "lock", "child_lock");
                    if (val instanceof Boolean) {
                        googleState.put("isLocked", val);
                    } else {
                        googleState.put("isLocked", false);
                    }
                    break;
                }
            }
        }

        return googleState;
    }

    /**
     * Find a DP value from the map by trying multiple code patterns.
     */
    private Object findDpValue(Map<String, Object> dpValueMap, String... patterns) {
        for (String pattern : patterns) {
            Object val = dpValueMap.get(pattern);
            if (val != null) return val;
        }
        return null;
    }

    /**
     * Find a DataPoint from a list by code patterns.
     */
    private DataPoint findDpByCodeInList(List<DataPoint> dataPoints, String... patterns) {
        for (String pattern : patterns) {
            for (DataPoint dp : dataPoints) {
                if (pattern.equals(dp.getCode())) return dp;
            }
        }
        return null;
    }

    /**
     * Reverse scale a DP value back to a target range (e.g., DP 10-1000 → Google 0-100).
     */
    private int reverseScaleValue(int dpValue, int targetMin, int targetMax, DataPoint dp) {
        JsonNode constraints = dp.getConstraints();
        if (constraints == null || !constraints.has("min") || !constraints.has("max")) {
            return dpValue;
        }
        int dpMin = constraints.get("min").asInt();
        int dpMax = constraints.get("max").asInt();

        if (dpMin == targetMin && dpMax == targetMax) {
            return dpValue;
        }

        double ratio = (double)(dpValue - dpMin) / (dpMax - dpMin);
        return (int)(targetMin + ratio * (targetMax - targetMin));
    }

    /**
     * Convert Tuya HSV color string to RGB integer.
     */
    private Integer tuyaColorStringToRgb(String colorStr) {
        try {
            JsonNode colorJson = objectMapper.readTree(colorStr);
            int h = colorJson.get("h").asInt();
            int s = colorJson.get("s").asInt();
            int v = colorJson.get("v").asInt();

            java.awt.Color color = java.awt.Color.getHSBColor(h / 360f, s / 1000f, v / 1000f);
            return (color.getRed() << 16) | (color.getGreen() << 8) | color.getBlue();
        } catch (Exception e) {
            log.error("Failed to parse Tuya color string: {}", colorStr);
            return null;
        }
    }

    private Object getKvValue(AttributeKvEntry entry) {
        if (entry.getBooleanValue().isPresent()) return entry.getBooleanValue().get();
        if (entry.getLongValue().isPresent()) return entry.getLongValue().get();
        if (entry.getDoubleValue().isPresent()) return entry.getDoubleValue().get();
        if (entry.getStrValue().isPresent()) return entry.getStrValue().get();
        if (entry.getJsonValue().isPresent()) return entry.getJsonValue().get();
        return null;
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
        return mapCategoryCodeToCapabilities(deviceType.toLowerCase());
    }

    /**
     * Get default capabilities from a DeviceProfile's linked ProductCategory.
     * Falls back to device type string matching if no category is linked.
     */
    public GoogleCapabilities getDefaultCapabilitiesForProfile(TenantId tenantId, DeviceProfile profile) {
        if (profile.getCategoryId() != null) {
            ProductCategory category = productCategoryService.findProductCategoryById(tenantId, profile.getCategoryId());
            if (category != null) {
                log.debug("Using ProductCategory '{}' ({}) for Google capabilities", category.getName(), category.getCode());
                return mapCategoryCodeToCapabilities(category.getCode());
            }
        }
        // Fallback to device type
        return mapCategoryCodeToCapabilities(profile.getType() != null ? profile.getType().name().toLowerCase() : "switch");
    }

    /**
     * Map category code (Tuya standard) to Google device type and traits.
     * Category codes: dj=Light, kg=Switch, cz=Plug, wk=Thermostat, fs=Fan, ms=Lock, cl=Curtain, cg=Sensor
     */
    private GoogleCapabilities mapCategoryCodeToCapabilities(String code) {
        String googleDeviceType;
        List<String> traits;

        switch (code) {
            // Tuya category codes
            case "dj":
            case "light":
            case "lamp":
            case "bulb":
                googleDeviceType = "action.devices.types.LIGHT";
                traits = Arrays.asList("OnOff", "Brightness", "ColorSetting");
                break;
            case "kg":
            case "switch":
                googleDeviceType = "action.devices.types.SWITCH";
                traits = Collections.singletonList("OnOff");
                break;
            case "cz":
            case "outlet":
            case "smartplug":
                googleDeviceType = "action.devices.types.OUTLET";
                traits = Collections.singletonList("OnOff");
                break;
            case "wk":
            case "thermostat":
            case "hvac":
                googleDeviceType = "action.devices.types.THERMOSTAT";
                traits = Arrays.asList("TemperatureSetting");
                break;
            case "fs":
            case "fan":
                googleDeviceType = "action.devices.types.FAN";
                traits = Arrays.asList("OnOff", "FanSpeed");
                break;
            case "ms":
            case "lock":
            case "door_lock":
                googleDeviceType = "action.devices.types.LOCK";
                traits = Collections.singletonList("LockUnlock");
                break;
            case "cl":
            case "curtain":
            case "curtain_track":
            case "curtain_robot":
                googleDeviceType = "action.devices.types.CURTAIN";
                traits = Arrays.asList("OpenClose");
                break;
            case "cg":
            case "sensor":
                googleDeviceType = "action.devices.types.SENSOR";
                traits = Collections.singletonList("SensorState");
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
            case "action.devices.commands.OpenClose":
            case "OpenClose":
                return "setOpenPercent";
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
            case "action.devices.commands.OpenClose":
            case "OpenClose":
                if (params.has("openPercent")) {
                    rpcParams.put("openPercent", params.get("openPercent").asInt());
                }
                break;
        }

        return rpcParams;
    }

    private void sendRpcCommand(Device device, String method, JsonNode params) {
        try {
            log.debug("Sending RPC command to device {}: method={}, params={}", device.getId(), method, params);

            // Create RPC request body
            // params can be object, primitive number, or primitive string
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

    /**
     * Get Google capabilities from device additional info
     */
    private GoogleCapabilities getDeviceCapabilities(Device device) {
        try {
            JsonNode additionalInfo = device.getAdditionalInfo();
            if (additionalInfo != null && additionalInfo.has(GOOGLE_CAPABILITIES_KEY)) {
                JsonNode capabilitiesNode = additionalInfo.get(GOOGLE_CAPABILITIES_KEY);
                return objectMapper.treeToValue(capabilitiesNode, GoogleCapabilities.class);
            }
        } catch (Exception e) {
            log.error("Error getting device capabilities: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Apply custom parameter mapping based on device configuration.
     * Returns JsonNode which can be ObjectNode (object), IntNode (number), or TextNode (string)
     */
    private JsonNode applyCustomParamMapping(ObjectNode standardParams, GoogleCapabilities.RpcMethodMapping customMapping) {
        String paramFormat = customMapping.getParamFormat();

        // Case 1: Numeric format - return primitive number (e.g., 1, not {"value": 1})
        if ("numeric".equals(paramFormat)) {
            // Convert object params to single numeric value
            // Typically for boolean: {"state": true} → 1
            if (standardParams.has("state")) {
                boolean boolValue = standardParams.get("state").asBoolean();
                return objectMapper.getNodeFactory().numberNode(boolValue ? 1 : 0);
            }
            // For brightness/percentage: {"brightness": 80} → 80
            if (standardParams.has("brightness")) {
                return objectMapper.getNodeFactory().numberNode(standardParams.get("brightness").asInt());
            }
            // Fallback: return first value as number
            if (standardParams.size() > 0) {
                String firstKey = standardParams.fieldNames().next();
                JsonNode firstValue = standardParams.get(firstKey);
                if (firstValue.isBoolean()) {
                    return objectMapper.getNodeFactory().numberNode(firstValue.asBoolean() ? 1 : 0);
                }
                return objectMapper.getNodeFactory().numberNode(firstValue.asInt());
            }
        }

        // Case 2: String format - return primitive string (e.g., "on", not {"value": "on"})
        else if ("string".equals(paramFormat)) {
            if (standardParams.size() > 0) {
                String firstKey = standardParams.fieldNames().next();
                return objectMapper.getNodeFactory().textNode(standardParams.get(firstKey).asText());
            }
        }

        // Case 3: Template format - return pre-configured string for on/off states
        // Used for devices that expect complex command strings (e.g., DPS format "001003001000000")
        // Supports: OnOff (state: true/false), OpenClose (openPercent: 0-100)
        else if ("template".equals(paramFormat)) {
            boolean isOn = false;
            if (standardParams.has("state")) {
                isOn = standardParams.get("state").asBoolean();
            } else if (standardParams.has("openPercent")) {
                isOn = standardParams.get("openPercent").asInt() > 0;
            } else if (standardParams.size() > 0) {
                String firstKey = standardParams.fieldNames().next();
                JsonNode firstValue = standardParams.get(firstKey);
                isOn = firstValue.isBoolean() ? firstValue.asBoolean() : firstValue.asInt() != 0;
            }
            String value = isOn ? customMapping.getOnValue() : customMapping.getOffValue();
            if (value != null) {
                return objectMapper.getNodeFactory().textNode(value);
            }
            return standardParams;
        }

        // Case 4: Object format with custom key mapping
        else if ("object".equals(paramFormat) && customMapping.getParamMapping() != null) {
            ObjectNode mappedParams = objectMapper.createObjectNode();
            Map<String, String> paramMapping = customMapping.getParamMapping();

            standardParams.fields().forEachRemaining(entry -> {
                String standardKey = entry.getKey();
                String customKey = paramMapping.getOrDefault(standardKey, standardKey);
                mappedParams.set(customKey, entry.getValue());
            });

            return mappedParams;
        }

        // Default: return as-is
        return standardParams;
    }
}
