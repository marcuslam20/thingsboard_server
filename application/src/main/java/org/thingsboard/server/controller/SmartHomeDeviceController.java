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
package org.thingsboard.server.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.MoreExecutors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.async.DeferredResult;
import org.thingsboard.common.util.JacksonUtil;
import org.thingsboard.server.common.data.AttributeScope;
import org.thingsboard.server.common.data.Device;
import org.thingsboard.server.common.data.exception.ThingsboardErrorCode;
import org.thingsboard.server.common.data.exception.ThingsboardException;
import org.thingsboard.server.common.data.id.DeviceId;
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.kv.AttributeKvEntry;
import org.thingsboard.server.common.data.kv.BaseAttributeKvEntry;
import org.thingsboard.server.common.data.kv.BooleanDataEntry;
import org.thingsboard.server.common.data.kv.DoubleDataEntry;
import org.thingsboard.server.common.data.kv.LongDataEntry;
import org.thingsboard.server.common.data.kv.StringDataEntry;
import org.thingsboard.server.common.data.smarthome.DataPoint;
import org.thingsboard.server.common.data.smarthome.DeviceGroup;
import org.thingsboard.server.common.data.smarthome.DeviceGroupMember;
import org.thingsboard.server.common.data.smarthome.DevicePairingToken;
import org.thingsboard.server.common.data.smarthome.DeviceShare;
import org.thingsboard.server.common.data.smarthome.DpMode;
import org.thingsboard.server.common.data.smarthome.DpType;
import org.thingsboard.server.dao.attributes.AttributesService;
import org.thingsboard.server.dao.smarthome.DataPointService;
import org.thingsboard.server.dao.smarthome.DeviceGroupService;
import org.thingsboard.server.dao.smarthome.DevicePairingService;
import org.thingsboard.server.dao.smarthome.DeviceShareService;
import org.thingsboard.server.queue.util.TbCoreComponent;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@TbCoreComponent
@RequestMapping("/api/smarthome")
@RequiredArgsConstructor
public class SmartHomeDeviceController extends AbstractRpcController {

    private final DevicePairingService devicePairingService;
    private final DeviceShareService deviceShareService;
    private final DeviceGroupService deviceGroupService;

    @Autowired
    private DataPointService dataPointService;

    @Autowired
    private AttributesService attributesService;

    // ========== Device Pairing ==========

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PostMapping("/pairing/token")
    public DevicePairingToken generatePairingToken(@RequestBody DevicePairingToken request) throws ThingsboardException {
        request.setTenantId(getTenantId());
        return checkNotNull(devicePairingService.generateToken(request));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @GetMapping("/pairing/token/{token}")
    public DevicePairingToken getPairingToken(@PathVariable("token") String token) throws ThingsboardException {
        checkParameter("token", token);
        return checkNotNull(devicePairingService.findByToken(token).orElse(null));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PostMapping("/pairing/confirm")
    public DevicePairingToken confirmPairing(@RequestBody Map<String, String> request) throws ThingsboardException {
        String token = request.get("token");
        String deviceIdStr = request.get("deviceId");
        checkParameter("token", token);
        checkParameter("deviceId", deviceIdStr);
        try {
            DeviceId deviceId = new DeviceId(toUUID(deviceIdStr));
            return checkNotNull(devicePairingService.confirmPairing(token, deviceId));
        } catch (IllegalArgumentException | IllegalStateException e) {
            throw new ThingsboardException(e.getMessage(), ThingsboardErrorCode.BAD_REQUEST_PARAMS);
        }
    }

    // ========== Device Sharing ==========

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PostMapping("/devices/{deviceId}/share")
    public DeviceShare shareDevice(
            @PathVariable("deviceId") String strDeviceId,
            @RequestBody(required = false) DeviceShare request) throws ThingsboardException {
        checkParameter("deviceId", strDeviceId);
        DeviceId deviceId = new DeviceId(toUUID(strDeviceId));
        if (request == null) {
            request = new DeviceShare();
        }
        request.setTenantId(getTenantId());
        request.setDeviceId(deviceId);
        request.setSharedByUserId(getCurrentUser().getId());
        return checkNotNull(deviceShareService.shareDevice(request));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PostMapping("/share/accept")
    public DeviceShare acceptShare(@RequestBody Map<String, String> request) throws ThingsboardException {
        String shareCode = request.get("shareCode");
        checkParameter("shareCode", shareCode);
        try {
            return checkNotNull(deviceShareService.acceptShare(shareCode, getCurrentUser().getId()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            throw new ThingsboardException(e.getMessage(), ThingsboardErrorCode.BAD_REQUEST_PARAMS);
        }
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @GetMapping("/devices/{deviceId}/shares")
    public List<DeviceShare> getDeviceShares(
            @PathVariable("deviceId") String strDeviceId) throws ThingsboardException {
        checkParameter("deviceId", strDeviceId);
        DeviceId deviceId = new DeviceId(toUUID(strDeviceId));
        return deviceShareService.findByDeviceId(deviceId);
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @DeleteMapping("/shares/{shareId}")
    public void revokeShare(@PathVariable("shareId") String strShareId) throws ThingsboardException {
        checkParameter("shareId", strShareId);
        try {
            deviceShareService.revokeShare(toUUID(strShareId));
        } catch (IllegalArgumentException e) {
            throw new ThingsboardException(e.getMessage(), ThingsboardErrorCode.ITEM_NOT_FOUND);
        }
    }

    // ========== Device Groups ==========

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PostMapping("/groups")
    public DeviceGroup createGroup(@RequestBody DeviceGroup group) throws ThingsboardException {
        group.setTenantId(getTenantId());
        return checkNotNull(deviceGroupService.createGroup(group));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @GetMapping("/homes/{homeId}/groups")
    public List<DeviceGroup> getGroups(
            @PathVariable("homeId") String strHomeId) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        return deviceGroupService.findBySmartHomeId(homeId);
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @DeleteMapping("/groups/{groupId}")
    public void deleteGroup(@PathVariable("groupId") String strGroupId) throws ThingsboardException {
        checkParameter("groupId", strGroupId);
        UUID groupId = toUUID(strGroupId);
        checkNotNull(deviceGroupService.findById(groupId).orElse(null));
        deviceGroupService.deleteGroup(groupId);
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PostMapping("/groups/{groupId}/devices")
    public DeviceGroupMember addDeviceToGroup(
            @PathVariable("groupId") String strGroupId,
            @RequestBody DeviceGroupMember member) throws ThingsboardException {
        checkParameter("groupId", strGroupId);
        UUID groupId = toUUID(strGroupId);
        checkNotNull(deviceGroupService.findById(groupId).orElse(null));
        return checkNotNull(deviceGroupService.addDevice(groupId, member.getDeviceId()));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @DeleteMapping("/groups/{groupId}/devices/{deviceId}")
    public void removeDeviceFromGroup(
            @PathVariable("groupId") String strGroupId,
            @PathVariable("deviceId") String strDeviceId) throws ThingsboardException {
        checkParameter("groupId", strGroupId);
        checkParameter("deviceId", strDeviceId);
        UUID groupId = toUUID(strGroupId);
        DeviceId deviceId = new DeviceId(toUUID(strDeviceId));
        checkNotNull(deviceGroupService.findById(groupId).orElse(null));
        deviceGroupService.removeDevice(groupId, deviceId);
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @GetMapping("/groups/{groupId}/devices")
    public List<DeviceGroupMember> getGroupDevices(
            @PathVariable("groupId") String strGroupId) throws ThingsboardException {
        checkParameter("groupId", strGroupId);
        UUID groupId = toUUID(strGroupId);
        checkNotNull(deviceGroupService.findById(groupId).orElse(null));
        return deviceGroupService.findDevices(groupId);
    }

    // ========== Device DP Command & Status ==========

    /**
     * Send a DP command to a device.
     * Validates the DP definition (type, mode, constraints) then sends RPC to device.
     *
     * Request body: { "dpId": 1, "value": "open" }
     * or multiple: { "dps": [{ "dpId": 1, "value": "open" }, { "dpId": 2, "value": 80 }] }
     */
    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PostMapping("/devices/{deviceId}/commands")
    public DeferredResult<ResponseEntity> sendDpCommand(
            @PathVariable("deviceId") String strDeviceId,
            @RequestBody JsonNode commandBody) throws ThingsboardException {
        checkParameter("deviceId", strDeviceId);
        DeviceId deviceId = new DeviceId(toUUID(strDeviceId));
        TenantId tenantId = getTenantId();

        // Get device to find its profile
        Device device = checkNotNull(deviceService.findDeviceById(tenantId, deviceId));

        // Collect DP commands to send
        List<JsonNode> dpCommands = new ArrayList<>();
        if (commandBody.has("dps") && commandBody.get("dps").isArray()) {
            for (JsonNode dp : commandBody.get("dps")) {
                dpCommands.add(dp);
            }
        } else if (commandBody.has("dpId")) {
            dpCommands.add(commandBody);
        } else {
            throw new ThingsboardException("Request must contain 'dpId' or 'dps' array", ThingsboardErrorCode.BAD_REQUEST_PARAMS);
        }

        // Validate each DP command against definition
        Map<String, Object> rpcParams = new HashMap<>();
        for (JsonNode dpCmd : dpCommands) {
            int dpId = dpCmd.get("dpId").asInt();
            JsonNode value = dpCmd.get("value");
            if (value == null) {
                throw new ThingsboardException("Missing 'value' for dpId " + dpId, ThingsboardErrorCode.BAD_REQUEST_PARAMS);
            }

            DataPoint dp = dataPointService.findDataPointByDeviceProfileIdAndDpId(device.getDeviceProfileId(), dpId);
            if (dp == null) {
                throw new ThingsboardException("DP " + dpId + " not defined for this product", ThingsboardErrorCode.BAD_REQUEST_PARAMS);
            }

            // Check mode allows writing
            if (dp.getMode() == DpMode.RO) {
                throw new ThingsboardException("DP " + dp.getDpId() + " (" + dp.getCode() + ") is read-only", ThingsboardErrorCode.BAD_REQUEST_PARAMS);
            }

            // Validate value against DP type and constraints
            validateDpValue(dp, value);

            rpcParams.put(String.valueOf(dpId), JacksonUtil.treeToValue(value, Object.class));
        }

        // Save commanded values as SHARED_SCOPE attributes so status API can read them.
        // Uses DP code as attribute key (e.g., "control", "percent_control", "switch_led").
        // When a real device reports back, it writes CLIENT_SCOPE attributes which take priority.
        List<AttributeKvEntry> attrsToSave = new ArrayList<>();
        long now = System.currentTimeMillis();
        for (JsonNode dpCmd : dpCommands) {
            int dpId = dpCmd.get("dpId").asInt();
            JsonNode value = dpCmd.get("value");
            DataPoint dp = dataPointService.findDataPointByDeviceProfileIdAndDpId(device.getDeviceProfileId(), dpId);
            if (dp != null) {
                AttributeKvEntry attr = toAttributeKvEntry(dp.getCode(), value, now);
                if (attr != null) {
                    attrsToSave.add(attr);
                }
            }
        }
        if (!attrsToSave.isEmpty()) {
            attributesService.save(tenantId, deviceId, AttributeScope.SHARED_SCOPE, attrsToSave);
            log.info("Saved {} DP values as shared attributes for device {}", attrsToSave.size(), deviceId);
        }

        // Build RPC request body: { "method": "setDps", "params": { "1": true, "2": 80 } }
        String rpcBody = JacksonUtil.toString(JacksonUtil.newObjectNode()
                .put("method", "setDps")
                .set("params", JacksonUtil.valueToTree(rpcParams)));

        log.info("Sending DP command to device {}: {}", deviceId, rpcParams);

        return handleDeviceRPCRequest(false, deviceId, rpcBody, HttpStatus.REQUEST_TIMEOUT, HttpStatus.CONFLICT);
    }

    /**
     * Get current DP status for a device.
     * Reads device attributes and maps them to DP definitions.
     */
    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @GetMapping("/devices/{deviceId}/status")
    public DeferredResult<ResponseEntity> getDeviceDpStatus(
            @PathVariable("deviceId") String strDeviceId) throws ThingsboardException {
        checkParameter("deviceId", strDeviceId);
        DeviceId deviceId = new DeviceId(toUUID(strDeviceId));
        TenantId tenantId = getTenantId();

        Device device = checkNotNull(deviceService.findDeviceById(tenantId, deviceId));

        // Get DP definitions for this product
        List<DataPoint> dataPoints = dataPointService.findDataPointsByDeviceProfileId(device.getDeviceProfileId());

        DeferredResult<ResponseEntity> result = new DeferredResult<>();

        // Read all attributes from CLIENT_SCOPE (device reports) and SHARED_SCOPE
        Futures.addCallback(
                attributesService.findAll(tenantId, deviceId, AttributeScope.CLIENT_SCOPE),
                new com.google.common.util.concurrent.FutureCallback<List<AttributeKvEntry>>() {
                    @Override
                    public void onSuccess(List<AttributeKvEntry> clientAttrs) {
                        // Also get shared attributes
                        Futures.addCallback(
                                attributesService.findAll(tenantId, deviceId, AttributeScope.SHARED_SCOPE),
                                new com.google.common.util.concurrent.FutureCallback<List<AttributeKvEntry>>() {
                                    @Override
                                    public void onSuccess(List<AttributeKvEntry> sharedAttrs) {
                                        // Merge all attributes into a lookup map.
                                        // Shared attrs first, then client attrs override (device-reported = ground truth).
                                        Map<String, Object> attrMap = new HashMap<>();
                                        for (AttributeKvEntry entry : sharedAttrs) {
                                            attrMap.put(entry.getKey(), getKvValue(entry));
                                        }
                                        for (AttributeKvEntry entry : clientAttrs) {
                                            attrMap.put(entry.getKey(), getKvValue(entry));
                                        }

                                        // Map DP definitions to current values
                                        List<Map<String, Object>> dpStatus = new ArrayList<>();
                                        for (DataPoint dp : dataPoints) {
                                            Map<String, Object> status = new HashMap<>();
                                            status.put("dpId", dp.getDpId());
                                            status.put("code", dp.getCode());
                                            status.put("name", dp.getName());
                                            status.put("dpType", dp.getDpType().name());
                                            status.put("mode", dp.getMode().name());

                                            // Try to find value by DP code, then by "dp_<dpId>"
                                            Object value = attrMap.get(dp.getCode());
                                            if (value == null) {
                                                value = attrMap.get("dp_" + dp.getDpId());
                                            }
                                            if (value == null) {
                                                value = attrMap.get(String.valueOf(dp.getDpId()));
                                            }
                                            status.put("value", value);

                                            dpStatus.add(status);
                                        }

                                        result.setResult(new ResponseEntity<>(dpStatus, HttpStatus.OK));
                                    }

                                    @Override
                                    public void onFailure(Throwable t) {
                                        log.error("Failed to read shared attributes for device {}", deviceId, t);
                                        result.setResult(new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR));
                                    }
                                },
                                MoreExecutors.directExecutor()
                        );
                    }

                    @Override
                    public void onFailure(Throwable t) {
                        log.error("Failed to read client attributes for device {}", deviceId, t);
                        result.setResult(new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR));
                    }
                },
                MoreExecutors.directExecutor()
        );

        return result;
    }

    // ========== DP Validation Helpers ==========

    private void validateDpValue(DataPoint dp, JsonNode value) throws ThingsboardException {
        JsonNode constraints = dp.getConstraints();
        switch (dp.getDpType()) {
            case BOOLEAN:
                if (!value.isBoolean()) {
                    throw new ThingsboardException("DP " + dp.getDpId() + " (" + dp.getCode() + ") expects boolean value", ThingsboardErrorCode.BAD_REQUEST_PARAMS);
                }
                break;
            case VALUE:
                if (!value.isNumber()) {
                    throw new ThingsboardException("DP " + dp.getDpId() + " (" + dp.getCode() + ") expects numeric value", ThingsboardErrorCode.BAD_REQUEST_PARAMS);
                }
                if (constraints != null) {
                    if (constraints.has("min") && value.asDouble() < constraints.get("min").asDouble()) {
                        throw new ThingsboardException("DP " + dp.getDpId() + " value below minimum " + constraints.get("min"), ThingsboardErrorCode.BAD_REQUEST_PARAMS);
                    }
                    if (constraints.has("max") && value.asDouble() > constraints.get("max").asDouble()) {
                        throw new ThingsboardException("DP " + dp.getDpId() + " value above maximum " + constraints.get("max"), ThingsboardErrorCode.BAD_REQUEST_PARAMS);
                    }
                }
                break;
            case ENUM:
                if (!value.isTextual()) {
                    throw new ThingsboardException("DP " + dp.getDpId() + " (" + dp.getCode() + ") expects string enum value", ThingsboardErrorCode.BAD_REQUEST_PARAMS);
                }
                if (constraints != null && constraints.has("range") && constraints.get("range").isArray()) {
                    boolean found = false;
                    for (JsonNode item : constraints.get("range")) {
                        if (item.asText().equals(value.asText())) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        throw new ThingsboardException("DP " + dp.getDpId() + " value '" + value.asText() + "' not in allowed range", ThingsboardErrorCode.BAD_REQUEST_PARAMS);
                    }
                }
                break;
            case STRING:
                if (!value.isTextual()) {
                    throw new ThingsboardException("DP " + dp.getDpId() + " (" + dp.getCode() + ") expects string value", ThingsboardErrorCode.BAD_REQUEST_PARAMS);
                }
                if (constraints != null && constraints.has("maxlen") && value.asText().length() > constraints.get("maxlen").asInt()) {
                    throw new ThingsboardException("DP " + dp.getDpId() + " string exceeds max length", ThingsboardErrorCode.BAD_REQUEST_PARAMS);
                }
                break;
            case RAW:
                // RAW accepts any value
                break;
            case FAULT:
                throw new ThingsboardException("DP " + dp.getDpId() + " (" + dp.getCode() + ") is a FAULT type and cannot be written", ThingsboardErrorCode.BAD_REQUEST_PARAMS);
        }
    }

    private AttributeKvEntry toAttributeKvEntry(String key, JsonNode value, long ts) {
        if (value.isBoolean()) {
            return new BaseAttributeKvEntry(new BooleanDataEntry(key, value.asBoolean()), ts);
        } else if (value.isInt() || value.isLong()) {
            return new BaseAttributeKvEntry(new LongDataEntry(key, value.asLong()), ts);
        } else if (value.isFloat() || value.isDouble()) {
            return new BaseAttributeKvEntry(new DoubleDataEntry(key, value.asDouble()), ts);
        } else if (value.isTextual()) {
            return new BaseAttributeKvEntry(new StringDataEntry(key, value.asText()), ts);
        }
        // For RAW/JSON types, store as string
        return new BaseAttributeKvEntry(new StringDataEntry(key, value.toString()), ts);
    }

    private Object getKvValue(AttributeKvEntry entry) {
        if (entry.getBooleanValue().isPresent()) return entry.getBooleanValue().get();
        if (entry.getLongValue().isPresent()) return entry.getLongValue().get();
        if (entry.getDoubleValue().isPresent()) return entry.getDoubleValue().get();
        if (entry.getStrValue().isPresent()) return entry.getStrValue().get();
        if (entry.getJsonValue().isPresent()) return entry.getJsonValue().get();
        return null;
    }
}
