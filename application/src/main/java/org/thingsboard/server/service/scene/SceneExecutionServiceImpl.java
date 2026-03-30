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
package org.thingsboard.server.service.scene;

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
import org.thingsboard.server.common.data.kv.BaseAttributeKvEntry;
import org.thingsboard.server.common.data.kv.BooleanDataEntry;
import org.thingsboard.server.common.data.kv.DoubleDataEntry;
import org.thingsboard.server.common.data.kv.LongDataEntry;
import org.thingsboard.server.common.data.kv.StringDataEntry;
import org.thingsboard.server.common.data.rpc.ToDeviceRpcRequestBody;
import org.thingsboard.server.common.data.smarthome.DataPoint;
import org.thingsboard.server.common.data.smarthome.DpMode;
import org.thingsboard.server.common.data.smarthome.SmartScene;
import org.thingsboard.server.common.data.smarthome.SmartSceneLog;
import org.thingsboard.server.common.msg.rpc.ToDeviceRpcRequest;
import org.thingsboard.server.dao.attributes.AttributesService;
import org.thingsboard.server.dao.device.DeviceService;
import org.thingsboard.server.dao.smarthome.DataPointService;
import org.thingsboard.server.dao.smarthome.SmartSceneLogService;
import org.thingsboard.server.dao.smarthome.SmartSceneService;
import org.thingsboard.server.queue.util.TbSceneEngineComponent;
import org.thingsboard.server.service.rpc.TbCoreDeviceRpcService;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@TbSceneEngineComponent   // ← Changed: runs in Scene Engine (executes actions)
@RequiredArgsConstructor
public class SceneExecutionServiceImpl implements SceneExecutionService {

    private final TbCoreDeviceRpcService rpcService;
    private final DeviceService deviceService;
    private final SmartSceneService smartSceneService;
    private final SmartSceneLogService smartSceneLogService;
    private final DataPointService dataPointService;
    private final AttributesService attributesService;

    private static final ObjectMapper mapper = new ObjectMapper();
    private static final int RPC_TIMEOUT_MS = 5000;

    // Thread pool for background scene execution (Tap-to-Run async)
    private ExecutorService sceneExecutor;
    // Scheduler for DELAY actions (replaces Thread.sleep)
    private ScheduledExecutorService delayScheduler;

    @PostConstruct
    public void init() {
        sceneExecutor = Executors.newFixedThreadPool(10); // max 10 scenes executing concurrently
        delayScheduler = Executors.newScheduledThreadPool(4); // handles delayed continuations
        log.info("SceneExecutionService initialized: executor=10 threads, delayScheduler=4 threads");
    }

    @PreDestroy
    public void destroy() {
        if (sceneExecutor != null) sceneExecutor.shutdown();
        if (delayScheduler != null) delayScheduler.shutdown();
        log.info("SceneExecutionService shut down");
    }

    @Override
    public SmartSceneLog executeSceneAsync(TenantId tenantId, SmartScene scene, String triggerType) {
        log.info("Async executing scene '{}' (id={}, trigger={})", scene.getName(), scene.getId(), triggerType);

        // Step 1: Create log with RUNNING status and return to caller immediately
        SmartSceneLog runningLog = logExecution(scene, triggerType, "RUNNING", "Execution started");

        // Step 2: Submit actions to background thread pool
        sceneExecutor.submit(() -> {
            try {
                executeActionsWithScheduledDelay(tenantId, scene, triggerType, runningLog.getId());
            } catch (Exception e) {
                log.error("Background execution failed for scene '{}'", scene.getName(), e);
                updateLogStatus(runningLog.getId(), "FAILURE", "Unexpected error: " + e.getMessage());
            }
        });

        return runningLog; // returned to app in ~50ms
    }

    @Override
    public SmartSceneLog executeScene(TenantId tenantId, SmartScene scene, String triggerType) {
        log.info("Executing scene '{}' (id={}, type={}, trigger={})",
                scene.getName(), scene.getId(), scene.getSceneType(), triggerType);

        JsonNode actions = scene.getActions();
        if (actions == null || !actions.isArray() || actions.isEmpty()) {
            log.warn("Scene '{}' has no actions to execute", scene.getName());
            return logExecution(scene, triggerType, "SUCCESS", "No actions to execute");
        }

        List<String> results = new ArrayList<>();
        int successCount = 0;
        int failCount = 0;

        for (int i = 0; i < actions.size(); i++) {
            JsonNode action = actions.get(i);
            String actionType = action.has("actionType") ? action.get("actionType").asText() : "UNKNOWN";

            try {
                switch (actionType) {
                    case "DEVICE_CONTROL":
                        executeDeviceControl(tenantId, action);
                        results.add("Action " + (i + 1) + ": DEVICE_CONTROL → OK");
                        successCount++;
                        break;

                    case "DELAY":
                        executeDelay(action);
                        results.add("Action " + (i + 1) + ": DELAY → OK");
                        successCount++;
                        break;

                    case "SCENE_RUN":
                        executeSceneRun(tenantId, action, triggerType);
                        results.add("Action " + (i + 1) + ": SCENE_RUN → OK");
                        successCount++;
                        break;

                    case "NOTIFICATION":
                        // Phase 5: Push notification — log for now
                        results.add("Action " + (i + 1) + ": NOTIFICATION → SKIPPED (not implemented)");
                        successCount++;
                        break;

                    case "SCENE_TOGGLE":
                        executeSceneToggle(action);
                        results.add("Action " + (i + 1) + ": SCENE_TOGGLE → OK");
                        successCount++;
                        break;

                    default:
                        results.add("Action " + (i + 1) + ": " + actionType + " → SKIPPED (unknown)");
                        break;
                }
            } catch (Exception e) {
                log.error("Failed to execute action {} in scene '{}'", i + 1, scene.getName(), e);
                results.add("Action " + (i + 1) + ": " + actionType + " → FAILED: " + e.getMessage());
                failCount++;
            }
        }

        String status = failCount == 0 ? "SUCCESS" : (successCount > 0 ? "PARTIAL" : "FAILURE");
        String details = String.join("; ", results);
        log.info("Scene '{}' execution completed: {}/{} actions succeeded",
                scene.getName(), successCount, successCount + failCount);

        return logExecution(scene, triggerType, status, details);
    }

    /**
     * Background execution with scheduled delay (no Thread.sleep).
     * Processes actions sequentially. When hitting DELAY, schedules remaining actions
     * to run after the delay period using ScheduledExecutorService.
     */
    private void executeActionsWithScheduledDelay(TenantId tenantId, SmartScene scene,
                                                   String triggerType, UUID logId) {
        JsonNode actions = scene.getActions();
        if (actions == null || !actions.isArray() || actions.isEmpty()) {
            updateLogStatus(logId, "SUCCESS", "No actions to execute");
            return;
        }
        executeActionsFromIndex(tenantId, scene, triggerType, logId, actions, 0,
                new ArrayList<>(), new int[]{0}, new int[]{0});
    }

    /**
     * Execute actions starting from a given index.
     * Called initially with index=0, and again after DELAY with the next index.
     */
    private void executeActionsFromIndex(TenantId tenantId, SmartScene scene, String triggerType,
                                          UUID logId, JsonNode actions, int startIndex,
                                          List<String> results, int[] successCount, int[] failCount) {
        for (int i = startIndex; i < actions.size(); i++) {
            JsonNode action = actions.get(i);
            String actionType = action.has("actionType") ? action.get("actionType").asText() : "UNKNOWN";

            try {
                if ("DELAY".equals(actionType)) {
                    // Schedule remaining actions after delay — don't block the thread
                    JsonNode prop = action.get("executorProperty");
                    int seconds = prop.has("seconds") ? prop.get("seconds").asInt(0) : 0;
                    int minutes = prop.has("minutes") ? prop.get("minutes").asInt(0) : 0;
                    long totalMs = Math.min((minutes * 60L + seconds) * 1000L, 300_000L);

                    if (totalMs > 0) {
                        results.add("Action " + (i + 1) + ": DELAY " + totalMs + "ms → SCHEDULED");
                        successCount[0]++;
                        log.debug("DELAY: scheduling remaining {} actions after {}ms", actions.size() - i - 1, totalMs);

                        final int nextIndex = i + 1;
                        delayScheduler.schedule(
                                () -> executeActionsFromIndex(tenantId, scene, triggerType,
                                        logId, actions, nextIndex, results, successCount, failCount),
                                totalMs, TimeUnit.MILLISECONDS
                        );
                        return; // exit loop — will continue from nextIndex after delay
                    }
                    results.add("Action " + (i + 1) + ": DELAY 0ms → SKIPPED");
                    successCount[0]++;
                    continue;
                }

                // Non-DELAY actions: execute normally
                switch (actionType) {
                    case "DEVICE_CONTROL":
                        executeDeviceControl(tenantId, action);
                        results.add("Action " + (i + 1) + ": DEVICE_CONTROL → OK");
                        successCount[0]++;
                        break;
                    case "SCENE_RUN":
                        executeSceneRun(tenantId, action, triggerType);
                        results.add("Action " + (i + 1) + ": SCENE_RUN → OK");
                        successCount[0]++;
                        break;
                    case "NOTIFICATION":
                        results.add("Action " + (i + 1) + ": NOTIFICATION → SKIPPED (not implemented)");
                        successCount[0]++;
                        break;
                    case "SCENE_TOGGLE":
                        executeSceneToggle(action);
                        results.add("Action " + (i + 1) + ": SCENE_TOGGLE → OK");
                        successCount[0]++;
                        break;
                    default:
                        results.add("Action " + (i + 1) + ": " + actionType + " → SKIPPED (unknown)");
                        break;
                }
            } catch (Exception e) {
                log.error("Failed to execute action {} in scene '{}'", i + 1, scene.getName(), e);
                results.add("Action " + (i + 1) + ": " + actionType + " → FAILED: " + e.getMessage());
                failCount[0]++;
            }
        }

        // All actions done (no more DELAY interruptions) — update log with final status
        String status = failCount[0] == 0 ? "SUCCESS" : (successCount[0] > 0 ? "PARTIAL" : "FAILURE");
        String details = String.join("; ", results);
        log.info("Scene '{}' async execution completed: {}/{} actions succeeded",
                scene.getName(), successCount[0], successCount[0] + failCount[0]);
        updateLogStatus(logId, status, details);
    }

    /**
     * Update an existing log entry with final execution status.
     */
    private void updateLogStatus(UUID logId, String status, String details) {
        try {
            smartSceneLogService.updateStatus(logId, status, details);
        } catch (Exception e) {
            log.error("Failed to update scene log {}: {}", logId, e.getMessage());
        }
    }

    /**
     * Execute DEVICE_CONTROL action: resolve DataPoint, validate, send RPC "setDps" to device,
     * and save shared attributes for status API — same flow as sendDpCommand.
     *
     * Supports two action formats:
     *
     * Format 1 (dpId — preferred, Tuya-compatible):
     * {
     *   "actionType": "DEVICE_CONTROL",
     *   "entityId": "device-uuid",
     *   "executorProperty": {
     *     "dpId": 1,
     *     "dpValue": true
     *   }
     * }
     *
     * Format 2 (dpCode — resolved to dpId via DataPoint system):
     * {
     *   "actionType": "DEVICE_CONTROL",
     *   "entityId": "device-uuid",
     *   "executorProperty": {
     *     "dpCode": "switch_led",
     *     "dpValue": true
     *   }
     * }
     */
    private void executeDeviceControl(TenantId tenantId, JsonNode action) {
        String deviceIdStr = action.get("entityId").asText();
        DeviceId deviceId = new DeviceId(UUID.fromString(deviceIdStr));
        JsonNode executorProperty = action.get("executorProperty");
        JsonNode dpValue = executorProperty.get("dpValue");

        Device device = deviceService.findDeviceById(tenantId, deviceId);
        if (device == null) {
            throw new RuntimeException("Device not found: " + deviceIdStr);
        }

        // Resolve DataPoint: support both dpId (number) and dpCode (string)
        DataPoint dp;
        if (executorProperty.has("dpId")) {
            int dpId = executorProperty.get("dpId").asInt();
            dp = dataPointService.findDataPointByDeviceProfileIdAndDpId(device.getDeviceProfileId(), dpId);
            if (dp == null) {
                throw new RuntimeException("DP " + dpId + " not defined for product of device " + device.getName());
            }
        } else if (executorProperty.has("dpCode")) {
            String dpCode = executorProperty.get("dpCode").asText();
            dp = dataPointService.findDataPointByDeviceProfileIdAndCode(device.getDeviceProfileId(), dpCode);
            if (dp == null) {
                throw new RuntimeException("DP code '" + dpCode + "' not defined for product of device " + device.getName());
            }
        } else {
            throw new RuntimeException("Action must contain 'dpId' or 'dpCode' in executorProperty");
        }

        // Validate mode — reject read-only DPs
        if (dp.getMode() == DpMode.RO) {
            throw new RuntimeException("DP " + dp.getDpId() + " (" + dp.getCode() + ") is read-only");
        }

        // Build RPC params with dpId as key (same as sendDpCommand): { "1": value }
        ObjectNode rpcParams = mapper.createObjectNode();
        rpcParams.set(String.valueOf(dp.getDpId()), dpValue);

        // Save shared attribute for status API (same as sendDpCommand)
        saveSharedAttribute(tenantId, deviceId, dp.getCode(), dpValue);

        sendFireAndForgetRpc(tenantId, device, "setDps", rpcParams);
        log.debug("DEVICE_CONTROL: sent setDps({}: {}) to device {} [dp={}, code={}]",
                dp.getDpId(), dpValue, device.getName(), dp.getDpId(), dp.getCode());
    }

    /**
     * Execute DELAY action: pause execution for specified duration.
     *
     * Action format:
     * {
     *   "actionType": "DELAY",
     *   "executorProperty": {
     *     "seconds": 5,
     *     "minutes": 0
     *   }
     * }
     */
    private void executeDelay(JsonNode action) throws InterruptedException {
        JsonNode prop = action.get("executorProperty");
        int seconds = prop.has("seconds") ? prop.get("seconds").asInt(0) : 0;
        int minutes = prop.has("minutes") ? prop.get("minutes").asInt(0) : 0;
        long totalMs = (minutes * 60L + seconds) * 1000L;

        if (totalMs > 0 && totalMs <= 300_000) { // max 5 minutes
            log.debug("DELAY: waiting {} ms", totalMs);
            Thread.sleep(totalMs);
        } else if (totalMs > 300_000) {
            log.warn("DELAY: {} ms exceeds max 5 minutes, capping at 5 minutes", totalMs);
            Thread.sleep(300_000);
        }
    }

    /**
     * Execute SCENE_RUN action: trigger another scene.
     *
     * Action format:
     * {
     *   "actionType": "SCENE_RUN",
     *   "entityId": "another-scene-uuid"
     * }
     */
    private void executeSceneRun(TenantId tenantId, JsonNode action, String triggerType) {
        String sceneIdStr = action.get("entityId").asText();
        UUID sceneId = UUID.fromString(sceneIdStr);

        SmartScene targetScene = smartSceneService.findById(sceneId).orElse(null);
        if (targetScene == null) {
            throw new RuntimeException("Target scene not found: " + sceneIdStr);
        }
        if (!targetScene.isEnabled()) {
            log.debug("SCENE_RUN: target scene '{}' is disabled, skipping", targetScene.getName());
            return;
        }

        log.debug("SCENE_RUN: triggering scene '{}'", targetScene.getName());
        executeScene(tenantId, targetScene, "SCENE_RUN");
    }

    /**
     * Execute SCENE_TOGGLE action: enable or disable another automation.
     *
     * Action format:
     * {
     *   "actionType": "SCENE_TOGGLE",
     *   "entityId": "automation-scene-uuid",
     *   "executorProperty": {
     *     "enabled": false
     *   }
     * }
     */
    private void executeSceneToggle(JsonNode action) {
        String sceneIdStr = action.get("entityId").asText();
        UUID sceneId = UUID.fromString(sceneIdStr);
        boolean enabled = action.get("executorProperty").get("enabled").asBoolean();

        if (enabled) {
            smartSceneService.enableScene(sceneId);
        } else {
            smartSceneService.disableScene(sceneId);
        }
        log.debug("SCENE_TOGGLE: scene {} set to enabled={}", sceneIdStr, enabled);
    }

    /**
     * Send fire-and-forget RPC to device via TB's actor system.
     * Does not block — returns immediately after enqueueing the message.
     */
    private void sendFireAndForgetRpc(TenantId tenantId, Device device, String method, JsonNode params) {
        try {
            ToDeviceRpcRequestBody body = new ToDeviceRpcRequestBody(method, params.toString());
            ToDeviceRpcRequest rpcRequest = new ToDeviceRpcRequest(
                    UUID.randomUUID(),
                    tenantId,
                    device.getId(),
                    true, // oneWay = fire-and-forget
                    System.currentTimeMillis() + TimeUnit.MILLISECONDS.toMillis(RPC_TIMEOUT_MS),
                    body,
                    false, // not persisted
                    0,     // no retries
                    null   // no additional info
            );

            rpcService.processRestApiRpcRequest(rpcRequest, response -> {
                if (response.getError().isPresent()) {
                    log.warn("RPC {} to device {} failed: {}", method, device.getName(), response.getError().get());
                } else {
                    log.debug("RPC {} to device {} sent successfully", method, device.getName());
                }
            }, null);
        } catch (Exception e) {
            log.error("Error sending RPC to device {}", device.getName(), e);
            throw new RuntimeException("Failed to send command to device: " + device.getName(), e);
        }
    }

    /**
     * Save DP value as shared attribute so status API can read it (same as sendDpCommand).
     */
    private void saveSharedAttribute(TenantId tenantId, DeviceId deviceId, String dpCode, JsonNode value) {
        try {
            long now = System.currentTimeMillis();
            AttributeKvEntry attr = toAttributeKvEntry(dpCode, value, now);
            if (attr != null) {
                attributesService.save(tenantId, deviceId, AttributeScope.SHARED_SCOPE, Collections.singletonList(attr));
                log.debug("Saved shared attribute {}={} for device {}", dpCode, value, deviceId);
            }
        } catch (Exception e) {
            log.warn("Failed to save shared attribute for device {}: {}", deviceId, e.getMessage());
            // Don't fail the action — attribute save is best-effort
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
        return new BaseAttributeKvEntry(new StringDataEntry(key, value.toString()), ts);
    }

    private SmartSceneLog logExecution(SmartScene scene, String triggerType, String status, String details) {
        ObjectNode executionDetails = mapper.createObjectNode();
        executionDetails.put("sceneName", scene.getName());
        executionDetails.put("sceneType", scene.getSceneType() != null ? scene.getSceneType().name() : "UNKNOWN");
        executionDetails.put("actionCount", scene.getActions() != null ? scene.getActions().size() : 0);
        executionDetails.put("details", details);

        SmartSceneLog logEntry = SmartSceneLog.builder()
                .sceneId(scene.getId())
                .triggerType(triggerType)
                .status(status)
                .executionDetails(executionDetails)
                .build();

        return smartSceneLogService.logExecution(logEntry);
    }
}
