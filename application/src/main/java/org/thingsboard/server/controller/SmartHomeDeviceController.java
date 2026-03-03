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

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.thingsboard.server.common.data.exception.ThingsboardErrorCode;
import org.thingsboard.server.common.data.exception.ThingsboardException;
import org.thingsboard.server.common.data.id.DeviceId;
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.smarthome.DeviceGroup;
import org.thingsboard.server.common.data.smarthome.DeviceGroupMember;
import org.thingsboard.server.common.data.smarthome.DevicePairingToken;
import org.thingsboard.server.common.data.smarthome.DeviceShare;
import org.thingsboard.server.dao.smarthome.DeviceGroupService;
import org.thingsboard.server.dao.smarthome.DevicePairingService;
import org.thingsboard.server.dao.smarthome.DeviceShareService;
import org.thingsboard.server.queue.util.TbCoreComponent;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@TbCoreComponent
@RequestMapping("/api/smarthome")
@RequiredArgsConstructor
public class SmartHomeDeviceController extends BaseController {

    private final DevicePairingService devicePairingService;
    private final DeviceShareService deviceShareService;
    private final DeviceGroupService deviceGroupService;

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
}
