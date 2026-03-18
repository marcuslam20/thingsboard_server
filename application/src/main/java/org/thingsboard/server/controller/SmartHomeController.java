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

import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.thingsboard.server.common.data.exception.ThingsboardException;
import org.thingsboard.server.common.data.id.CustomerId;
import org.thingsboard.server.common.data.id.DeviceId;
import org.thingsboard.server.common.data.id.RoomId;
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.common.data.page.PageData;
import org.thingsboard.server.common.data.page.PageLink;
import org.thingsboard.server.common.data.security.Authority;
import org.thingsboard.server.common.data.Device;
import org.thingsboard.server.common.data.exception.ThingsboardErrorCode;
import org.thingsboard.server.common.data.smarthome.Room;
import org.thingsboard.server.common.data.smarthome.RoomDevice;
import org.thingsboard.server.common.data.smarthome.SmartHome;
import org.thingsboard.server.common.data.smarthome.SmartHomeDevice;
import org.thingsboard.server.common.data.smarthome.SmartHomeMember;
import org.thingsboard.server.common.data.smarthome.SmartHomeMemberRole;
import org.thingsboard.server.common.data.smarthome.SmartHomeMemberStatus;
import org.thingsboard.server.dao.smarthome.RoomDeviceService;
import org.thingsboard.server.dao.smarthome.RoomService;
import org.thingsboard.server.dao.smarthome.SmartHomeDeviceService;
import org.thingsboard.server.dao.smarthome.SmartHomeMemberService;
import org.thingsboard.server.dao.smarthome.SmartHomeService;
import org.thingsboard.server.queue.util.TbCoreComponent;
import org.thingsboard.server.service.security.model.SecurityUser;
import org.thingsboard.server.service.security.permission.Operation;
import org.thingsboard.server.service.security.permission.Resource;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@RestController
@TbCoreComponent
@RequestMapping("/api/smarthome/homes")
@RequiredArgsConstructor
public class SmartHomeController extends BaseController {

    private final SmartHomeService smartHomeService;
    private final SmartHomeMemberService smartHomeMemberService;
    private final RoomService roomService;
    private final RoomDeviceService roomDeviceService;
    private final SmartHomeDeviceService smartHomeDeviceService;

    // ========== Smart Home CRUD ==========

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PostMapping
    public SmartHome createSmartHome(@RequestBody SmartHome smartHome) throws ThingsboardException {
        smartHome.setTenantId(getTenantId());
        smartHome.setOwnerUserId(getCurrentUser().getId());
        return checkNotNull(smartHomeService.saveSmartHome(smartHome));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @GetMapping
    public List<SmartHome> getSmartHomes() throws ThingsboardException {
        SecurityUser currentUser = getCurrentUser();
        if (Authority.TENANT_ADMIN.equals(currentUser.getAuthority())) {
            return smartHomeService.findSmartHomesByTenantId(getTenantId(),
                    createPageLink(1000, 0, null, null, null)).getData();
        }
        List<SmartHome> homes = smartHomeService.findSmartHomesByUserId(currentUser.getId());
        if (homes.isEmpty()) {
            // Auto-create default home for first-time user (Tuya-like)
            homes = List.of(createDefaultHome(currentUser));
        }
        return homes;
    }

    /**
     * Auto-create "Nhà của tôi" and assign existing customer devices to it.
     */
    private SmartHome createDefaultHome(SecurityUser currentUser) throws ThingsboardException {
        log.info("Auto-creating default home for user {}", currentUser.getEmail());

        SmartHome home = new SmartHome();
        home.setTenantId(getTenantId());
        home.setOwnerUserId(currentUser.getId());
        home.setName("Nhà của tôi");
        home = smartHomeService.saveSmartHome(home);

        // Auto-assign existing customer devices to the new home
        CustomerId customerId = currentUser.getCustomerId();
        if (customerId != null && !customerId.isNullUid()) {
            PageData<Device> devices = deviceService.findDevicesByTenantIdAndCustomerId(
                    getTenantId(), customerId, new PageLink(1000));
            int count = 0;
            for (Device device : devices.getData()) {
                if (!smartHomeDeviceService.isDeviceInAnyHome(device.getId())) {
                    SmartHomeDevice shd = new SmartHomeDevice();
                    shd.setSmartHomeId(home.getId());
                    shd.setDeviceId(device.getId());
                    smartHomeDeviceService.addDeviceToHome(shd);
                    count++;
                }
            }
            if (count > 0) {
                log.info("Auto-assigned {} existing devices to default home for user {}",
                        count, currentUser.getEmail());
            }
        }

        return home;
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @GetMapping("/{homeId}")
    public SmartHome getSmartHome(@PathVariable("homeId") String strHomeId) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        SmartHome home = checkNotNull(smartHomeService.findSmartHomeById(getTenantId(), homeId));
        checkSmartHomeMembership(homeId);
        return home;
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PutMapping("/{homeId}")
    public SmartHome updateSmartHome(
            @PathVariable("homeId") String strHomeId,
            @RequestBody SmartHome smartHome) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        SmartHome existingHome = checkNotNull(smartHomeService.findSmartHomeById(getTenantId(), homeId));
        checkSmartHomeRole(homeId, SmartHomeMemberRole.OWNER, SmartHomeMemberRole.ADMIN);
        smartHome.setId(homeId);
        smartHome.setTenantId(existingHome.getTenantId());
        smartHome.setOwnerUserId(existingHome.getOwnerUserId());
        smartHome.setVersion(existingHome.getVersion());
        return checkNotNull(smartHomeService.saveSmartHome(smartHome));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @DeleteMapping("/{homeId}")
    public void deleteSmartHome(@PathVariable("homeId") String strHomeId) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        checkNotNull(smartHomeService.findSmartHomeById(getTenantId(), homeId));
        checkSmartHomeRole(homeId, SmartHomeMemberRole.OWNER);
        smartHomeService.deleteSmartHome(getTenantId(), homeId);
    }

    // ========== Member Management ==========

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PostMapping("/{homeId}/members")
    public SmartHomeMember addMember(
            @PathVariable("homeId") String strHomeId,
            @RequestBody SmartHomeMember member) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        checkNotNull(smartHomeService.findSmartHomeById(getTenantId(), homeId));
        checkSmartHomeRole(homeId, SmartHomeMemberRole.OWNER, SmartHomeMemberRole.ADMIN);
        member.setSmartHomeId(homeId);
        member.setStatus(SmartHomeMemberStatus.ACTIVE);
        member.setInvitedBy(getCurrentUser().getId());
        return checkNotNull(smartHomeMemberService.addMember(member));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @GetMapping("/{homeId}/members")
    public List<SmartHomeMember> getMembers(
            @PathVariable("homeId") String strHomeId) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        checkNotNull(smartHomeService.findSmartHomeById(getTenantId(), homeId));
        checkSmartHomeMembership(homeId);
        return smartHomeMemberService.findMembersBySmartHomeId(homeId);
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PutMapping("/{homeId}/members/{memberId}")
    public SmartHomeMember updateMemberRole(
            @PathVariable("homeId") String strHomeId,
            @PathVariable("memberId") String strMemberId,
            @RequestBody SmartHomeMember memberUpdate) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        checkParameter("memberId", strMemberId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        checkNotNull(smartHomeService.findSmartHomeById(getTenantId(), homeId));
        checkSmartHomeRole(homeId, SmartHomeMemberRole.OWNER);
        UUID memberId = toUUID(strMemberId);
        SmartHomeMember existingMember = checkNotNull(smartHomeMemberService.findMemberById(memberId).orElse(null));
        existingMember.setRole(memberUpdate.getRole());
        return checkNotNull(smartHomeMemberService.updateMember(existingMember));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @DeleteMapping("/{homeId}/members/{memberId}")
    public void removeMember(
            @PathVariable("homeId") String strHomeId,
            @PathVariable("memberId") String strMemberId) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        checkParameter("memberId", strMemberId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        checkNotNull(smartHomeService.findSmartHomeById(getTenantId(), homeId));
        checkSmartHomeRole(homeId, SmartHomeMemberRole.OWNER);
        UUID memberId = toUUID(strMemberId);
        SmartHomeMember member = checkNotNull(smartHomeMemberService.findMemberById(memberId).orElse(null));
        if (member.getRole() == SmartHomeMemberRole.OWNER) {
            throw new ThingsboardException("Cannot remove the owner of the smart home",
                    org.thingsboard.server.common.data.exception.ThingsboardErrorCode.PERMISSION_DENIED);
        }
        smartHomeMemberService.removeMember(memberId);
    }

    // ========== Home Device Management ==========

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @GetMapping("/{homeId}/devices")
    public List<SmartHomeDevice> getDevicesInHome(
            @PathVariable("homeId") String strHomeId) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        checkNotNull(smartHomeService.findSmartHomeById(getTenantId(), homeId));
        checkSmartHomeMembership(homeId);
        return smartHomeDeviceService.findDevicesByHomeId(homeId);
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PostMapping("/{homeId}/devices")
    public SmartHomeDevice addDeviceToHome(
            @PathVariable("homeId") String strHomeId,
            @RequestBody SmartHomeDevice request) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        checkNotNull(smartHomeService.findSmartHomeById(getTenantId(), homeId));
        checkSmartHomeRole(homeId, SmartHomeMemberRole.OWNER, SmartHomeMemberRole.ADMIN);

        // Verify device exists and belongs to this tenant
        DeviceId deviceId = request.getDeviceId();
        checkNotNull(deviceService.findDeviceById(getTenantId(), deviceId));

        // Check device is not already in another home
        if (smartHomeDeviceService.isDeviceInAnyHome(deviceId)) {
            throw new ThingsboardException("Device is already assigned to a home",
                    ThingsboardErrorCode.BAD_REQUEST_PARAMS);
        }

        request.setSmartHomeId(homeId);
        return checkNotNull(smartHomeDeviceService.addDeviceToHome(request));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PutMapping("/{homeId}/devices/{deviceId}")
    public SmartHomeDevice updateDeviceInHome(
            @PathVariable("homeId") String strHomeId,
            @PathVariable("deviceId") String strDeviceId,
            @RequestBody SmartHomeDevice request) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        checkParameter("deviceId", strDeviceId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        DeviceId deviceId = new DeviceId(toUUID(strDeviceId));
        checkNotNull(smartHomeService.findSmartHomeById(getTenantId(), homeId));
        checkSmartHomeRole(homeId, SmartHomeMemberRole.OWNER, SmartHomeMemberRole.ADMIN);

        SmartHomeDevice existing = smartHomeDeviceService.findByDeviceId(deviceId)
                .orElseThrow(() -> new ThingsboardException("Device not found in this home",
                        ThingsboardErrorCode.ITEM_NOT_FOUND));

        // Validate room belongs to this home if provided
        if (request.getRoomId() != null) {
            checkNotNull(roomService.findRoomById(getTenantId(), request.getRoomId()));
        }

        existing.setRoomId(request.getRoomId());
        existing.setDeviceName(request.getDeviceName());
        existing.setSortOrder(request.getSortOrder());
        return checkNotNull(smartHomeDeviceService.updateDevice(existing));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @DeleteMapping("/{homeId}/devices/{deviceId}")
    public void removeDeviceFromHome(
            @PathVariable("homeId") String strHomeId,
            @PathVariable("deviceId") String strDeviceId) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        checkParameter("deviceId", strDeviceId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        DeviceId deviceId = new DeviceId(toUUID(strDeviceId));
        checkNotNull(smartHomeService.findSmartHomeById(getTenantId(), homeId));
        checkSmartHomeRole(homeId, SmartHomeMemberRole.OWNER, SmartHomeMemberRole.ADMIN);
        smartHomeDeviceService.removeDeviceFromHome(homeId, deviceId);
    }

    // ========== Room Management ==========

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PostMapping("/{homeId}/rooms")
    public Room createRoom(
            @PathVariable("homeId") String strHomeId,
            @RequestBody Room room) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        checkNotNull(smartHomeService.findSmartHomeById(getTenantId(), homeId));
        checkSmartHomeRole(homeId, SmartHomeMemberRole.OWNER, SmartHomeMemberRole.ADMIN);
        room.setTenantId(getTenantId());
        room.setSmartHomeId(homeId);
        return checkNotNull(roomService.saveRoom(room));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @GetMapping("/{homeId}/rooms")
    public List<Room> getRooms(
            @PathVariable("homeId") String strHomeId) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        checkNotNull(smartHomeService.findSmartHomeById(getTenantId(), homeId));
        checkSmartHomeMembership(homeId);
        return roomService.findRoomsBySmartHomeId(homeId);
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PutMapping("/{homeId}/rooms/{roomId}")
    public Room updateRoom(
            @PathVariable("homeId") String strHomeId,
            @PathVariable("roomId") String strRoomId,
            @RequestBody Room room) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        checkParameter("roomId", strRoomId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        RoomId roomId = new RoomId(toUUID(strRoomId));
        checkNotNull(smartHomeService.findSmartHomeById(getTenantId(), homeId));
        checkSmartHomeRole(homeId, SmartHomeMemberRole.OWNER, SmartHomeMemberRole.ADMIN);
        Room existingRoom = checkNotNull(roomService.findRoomById(getTenantId(), roomId));
        room.setId(roomId);
        room.setTenantId(existingRoom.getTenantId());
        room.setSmartHomeId(existingRoom.getSmartHomeId());
        room.setVersion(existingRoom.getVersion());
        return checkNotNull(roomService.saveRoom(room));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @DeleteMapping("/{homeId}/rooms/{roomId}")
    public void deleteRoom(
            @PathVariable("homeId") String strHomeId,
            @PathVariable("roomId") String strRoomId) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        checkParameter("roomId", strRoomId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        RoomId roomId = new RoomId(toUUID(strRoomId));
        checkNotNull(smartHomeService.findSmartHomeById(getTenantId(), homeId));
        checkSmartHomeRole(homeId, SmartHomeMemberRole.OWNER, SmartHomeMemberRole.ADMIN);
        checkNotNull(roomService.findRoomById(getTenantId(), roomId));
        roomService.deleteRoom(getTenantId(), roomId);
    }

    // ========== Room Device Assignment ==========

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PostMapping("/{homeId}/rooms/{roomId}/devices")
    public RoomDevice addDeviceToRoom(
            @PathVariable("homeId") String strHomeId,
            @PathVariable("roomId") String strRoomId,
            @RequestBody RoomDevice roomDevice) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        checkParameter("roomId", strRoomId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        RoomId roomId = new RoomId(toUUID(strRoomId));
        checkNotNull(smartHomeService.findSmartHomeById(getTenantId(), homeId));
        checkSmartHomeRole(homeId, SmartHomeMemberRole.OWNER, SmartHomeMemberRole.ADMIN);
        checkNotNull(roomService.findRoomById(getTenantId(), roomId));
        roomDevice.setRoomId(roomId);
        return checkNotNull(roomDeviceService.addDeviceToRoom(roomDevice));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @GetMapping("/{homeId}/rooms/{roomId}/devices")
    public List<RoomDevice> getDevicesInRoom(
            @PathVariable("homeId") String strHomeId,
            @PathVariable("roomId") String strRoomId) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        checkParameter("roomId", strRoomId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        RoomId roomId = new RoomId(toUUID(strRoomId));
        checkNotNull(smartHomeService.findSmartHomeById(getTenantId(), homeId));
        checkSmartHomeMembership(homeId);
        checkNotNull(roomService.findRoomById(getTenantId(), roomId));
        return roomDeviceService.findDevicesByRoomId(roomId);
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @DeleteMapping("/{homeId}/rooms/{roomId}/devices/{deviceId}")
    public void removeDeviceFromRoom(
            @PathVariable("homeId") String strHomeId,
            @PathVariable("roomId") String strRoomId,
            @PathVariable("deviceId") String strDeviceId) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        checkParameter("roomId", strRoomId);
        checkParameter("deviceId", strDeviceId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        RoomId roomId = new RoomId(toUUID(strRoomId));
        DeviceId deviceId = new DeviceId(toUUID(strDeviceId));
        checkNotNull(smartHomeService.findSmartHomeById(getTenantId(), homeId));
        checkSmartHomeRole(homeId, SmartHomeMemberRole.OWNER, SmartHomeMemberRole.ADMIN);
        checkNotNull(roomService.findRoomById(getTenantId(), roomId));
        roomDeviceService.removeDeviceFromRoom(roomId, deviceId);
    }

    // ========== Helper Methods ==========

    private void checkSmartHomeMembership(SmartHomeId homeId) throws ThingsboardException {
        SecurityUser currentUser = getCurrentUser();
        if (Authority.TENANT_ADMIN.equals(currentUser.getAuthority())) {
            return;
        }
        if (!smartHomeMemberService.isMember(homeId, currentUser.getId())) {
            throw new ThingsboardException("You are not a member of this smart home",
                    org.thingsboard.server.common.data.exception.ThingsboardErrorCode.PERMISSION_DENIED);
        }
    }

    private void checkSmartHomeRole(SmartHomeId homeId, SmartHomeMemberRole... allowedRoles) throws ThingsboardException {
        SecurityUser currentUser = getCurrentUser();
        if (Authority.TENANT_ADMIN.equals(currentUser.getAuthority())) {
            return;
        }
        Optional<SmartHomeMemberRole> roleOpt = smartHomeMemberService.getMemberRole(homeId, currentUser.getId());
        if (roleOpt.isEmpty()) {
            throw new ThingsboardException("You are not a member of this smart home",
                    org.thingsboard.server.common.data.exception.ThingsboardErrorCode.PERMISSION_DENIED);
        }
        SmartHomeMemberRole role = roleOpt.get();
        for (SmartHomeMemberRole allowed : allowedRoles) {
            if (role == allowed) {
                return;
            }
        }
        throw new ThingsboardException("You don't have the required role for this operation",
                org.thingsboard.server.common.data.exception.ThingsboardErrorCode.PERMISSION_DENIED);
    }
}
