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
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.thingsboard.server.common.data.exception.ThingsboardErrorCode;
import org.thingsboard.server.common.data.exception.ThingsboardException;
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.security.Authority;
import org.thingsboard.server.common.data.smarthome.SceneType;
import org.thingsboard.server.common.data.smarthome.SmartScene;
import org.thingsboard.server.common.data.smarthome.SmartSceneLog;
import org.thingsboard.server.common.data.smarthome.SmartHomeMemberRole;
import org.thingsboard.server.common.data.smarthome.TriggerType;
import org.thingsboard.server.dao.smarthome.SmartHomeMemberService;
import org.thingsboard.server.dao.smarthome.SmartHomeService;
import org.thingsboard.server.dao.smarthome.SmartSceneLogService;
import org.thingsboard.server.dao.smarthome.SmartSceneService;
import org.thingsboard.server.queue.util.TbCoreComponent;
import org.thingsboard.server.service.security.model.SecurityUser;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@RestController
@TbCoreComponent
@RequestMapping("/api/smarthome")
@RequiredArgsConstructor
public class SmartSceneController extends BaseController {

    private final SmartSceneService smartSceneService;
    private final SmartSceneLogService smartSceneLogService;
    private final SmartHomeMemberService smartHomeMemberService;
    private final SmartHomeService smartHomeService;

    private static final ObjectMapper mapper = new ObjectMapper();

    // ========== Scene CRUD ==========

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PostMapping("/homes/{homeId}/scenes")
    public SmartScene createScene(
            @PathVariable("homeId") String strHomeId,
            @RequestBody SmartScene scene) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        checkNotNull(smartHomeService.findSmartHomeById(getTenantId(), homeId));
        checkSmartHomeRole(homeId, SmartHomeMemberRole.OWNER, SmartHomeMemberRole.ADMIN);
        scene.setTenantId(getTenantId());
        scene.setSmartHomeId(homeId);
        if (scene.getConditionLogic() == null) {
            scene.setConditionLogic("AND");
        }
        scene.setEnabled(true);
        return checkNotNull(smartSceneService.createScene(scene));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @GetMapping("/homes/{homeId}/scenes")
    public List<SmartScene> getScenes(
            @PathVariable("homeId") String strHomeId,
            @RequestParam(value = "sceneType", required = false) String sceneTypeStr) throws ThingsboardException {
        checkParameter("homeId", strHomeId);
        SmartHomeId homeId = new SmartHomeId(toUUID(strHomeId));
        checkNotNull(smartHomeService.findSmartHomeById(getTenantId(), homeId));
        checkSmartHomeMembership(homeId);
        if (sceneTypeStr != null) {
            SceneType sceneType = SceneType.valueOf(sceneTypeStr);
            return smartSceneService.findBySmartHomeIdAndType(homeId, sceneType);
        }
        return smartSceneService.findBySmartHomeId(homeId);
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @GetMapping("/scenes/{sceneId}")
    public SmartScene getScene(
            @PathVariable("sceneId") String strSceneId) throws ThingsboardException {
        checkParameter("sceneId", strSceneId);
        UUID sceneId = toUUID(strSceneId);
        SmartScene scene = checkNotNull(smartSceneService.findById(sceneId).orElse(null));
        if (!scene.getTenantId().equals(getTenantId())) {
            throw new ThingsboardException("Scene not found", ThingsboardErrorCode.ITEM_NOT_FOUND);
        }
        checkSmartHomeMembership(scene.getSmartHomeId());
        return scene;
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PutMapping("/scenes/{sceneId}")
    public SmartScene updateScene(
            @PathVariable("sceneId") String strSceneId,
            @RequestBody SmartScene scene) throws ThingsboardException {
        checkParameter("sceneId", strSceneId);
        UUID sceneId = toUUID(strSceneId);
        SmartScene existing = checkNotNull(smartSceneService.findById(sceneId).orElse(null));
        if (!existing.getTenantId().equals(getTenantId())) {
            throw new ThingsboardException("Scene not found", ThingsboardErrorCode.ITEM_NOT_FOUND);
        }
        checkSmartHomeRole(existing.getSmartHomeId(), SmartHomeMemberRole.OWNER, SmartHomeMemberRole.ADMIN);
        // Preserve immutable fields
        scene.setId(sceneId);
        scene.setCreatedTime(existing.getCreatedTime());
        scene.setTenantId(existing.getTenantId());
        scene.setSmartHomeId(existing.getSmartHomeId());
        scene.setVersion(existing.getVersion());
        return checkNotNull(smartSceneService.updateScene(scene));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @DeleteMapping("/scenes/{sceneId}")
    public void deleteScene(
            @PathVariable("sceneId") String strSceneId) throws ThingsboardException {
        checkParameter("sceneId", strSceneId);
        UUID sceneId = toUUID(strSceneId);
        SmartScene scene = checkNotNull(smartSceneService.findById(sceneId).orElse(null));
        if (!scene.getTenantId().equals(getTenantId())) {
            throw new ThingsboardException("Scene not found", ThingsboardErrorCode.ITEM_NOT_FOUND);
        }
        checkSmartHomeRole(scene.getSmartHomeId(), SmartHomeMemberRole.OWNER, SmartHomeMemberRole.ADMIN);
        smartSceneService.deleteScene(sceneId);
    }

    // ========== Scene Execution ==========

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PostMapping("/scenes/{sceneId}/execute")
    public SmartSceneLog executeScene(
            @PathVariable("sceneId") String strSceneId) throws ThingsboardException {
        checkParameter("sceneId", strSceneId);
        UUID sceneId = toUUID(strSceneId);
        SmartScene scene = checkNotNull(smartSceneService.findById(sceneId).orElse(null));
        if (!scene.getTenantId().equals(getTenantId())) {
            throw new ThingsboardException("Scene not found", ThingsboardErrorCode.ITEM_NOT_FOUND);
        }
        checkSmartHomeMembership(scene.getSmartHomeId());
        // MVP: Log execution with MANUAL trigger, SUCCESS status
        // Actual RPC to devices will be implemented in Phase 7
        ObjectNode details = mapper.createObjectNode();
        details.put("sceneName", scene.getName());
        details.put("actions", scene.getActions() != null ? scene.getActions().toString() : "[]");
        details.put("executedBy", getCurrentUser().getId().getId().toString());
        SmartSceneLog logEntry = SmartSceneLog.builder()
                .sceneId(sceneId)
                .triggerType(TriggerType.MANUAL.name())
                .status("SUCCESS")
                .executionDetails(details)
                .build();
        return checkNotNull(smartSceneLogService.logExecution(logEntry));
    }

    // ========== Scene Logs ==========

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @GetMapping("/scenes/{sceneId}/logs")
    public List<SmartSceneLog> getSceneLogs(
            @PathVariable("sceneId") String strSceneId) throws ThingsboardException {
        checkParameter("sceneId", strSceneId);
        UUID sceneId = toUUID(strSceneId);
        SmartScene scene = checkNotNull(smartSceneService.findById(sceneId).orElse(null));
        if (!scene.getTenantId().equals(getTenantId())) {
            throw new ThingsboardException("Scene not found", ThingsboardErrorCode.ITEM_NOT_FOUND);
        }
        checkSmartHomeMembership(scene.getSmartHomeId());
        return smartSceneLogService.findBySceneId(sceneId);
    }

    // ========== Enable/Disable ==========

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PutMapping("/scenes/{sceneId}/enable")
    public SmartScene enableScene(
            @PathVariable("sceneId") String strSceneId) throws ThingsboardException {
        checkParameter("sceneId", strSceneId);
        UUID sceneId = toUUID(strSceneId);
        SmartScene scene = checkNotNull(smartSceneService.findById(sceneId).orElse(null));
        if (!scene.getTenantId().equals(getTenantId())) {
            throw new ThingsboardException("Scene not found", ThingsboardErrorCode.ITEM_NOT_FOUND);
        }
        checkSmartHomeRole(scene.getSmartHomeId(), SmartHomeMemberRole.OWNER, SmartHomeMemberRole.ADMIN);
        return checkNotNull(smartSceneService.enableScene(sceneId));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @PutMapping("/scenes/{sceneId}/disable")
    public SmartScene disableScene(
            @PathVariable("sceneId") String strSceneId) throws ThingsboardException {
        checkParameter("sceneId", strSceneId);
        UUID sceneId = toUUID(strSceneId);
        SmartScene scene = checkNotNull(smartSceneService.findById(sceneId).orElse(null));
        if (!scene.getTenantId().equals(getTenantId())) {
            throw new ThingsboardException("Scene not found", ThingsboardErrorCode.ITEM_NOT_FOUND);
        }
        checkSmartHomeRole(scene.getSmartHomeId(), SmartHomeMemberRole.OWNER, SmartHomeMemberRole.ADMIN);
        return checkNotNull(smartSceneService.disableScene(sceneId));
    }

    // ========== Helper Methods ==========

    private void checkSmartHomeMembership(SmartHomeId homeId) throws ThingsboardException {
        SecurityUser currentUser = getCurrentUser();
        if (Authority.TENANT_ADMIN.equals(currentUser.getAuthority())) {
            return;
        }
        if (!smartHomeMemberService.isMember(homeId, currentUser.getId())) {
            throw new ThingsboardException("You are not a member of this smart home",
                    ThingsboardErrorCode.PERMISSION_DENIED);
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
                    ThingsboardErrorCode.PERMISSION_DENIED);
        }
        SmartHomeMemberRole role = roleOpt.get();
        for (SmartHomeMemberRole allowed : allowedRoles) {
            if (role == allowed) {
                return;
            }
        }
        throw new ThingsboardException("You don't have the required role for this operation",
                ThingsboardErrorCode.PERMISSION_DENIED);
    }
}
