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
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.smarthome.SmartScene;
import org.thingsboard.server.common.data.smarthome.SmartSceneLog;

/**
 * Service for executing Smart Scene actions.
 * Phase 1: Tap-to-Run (direct execution, fire-and-forget RPC)
 * Phase 2+: Automation triggers via queue (Schedule, Device Status, Weather)
 */
public interface SceneExecutionService {

    /**
     * Execute a scene's actions.
     * For TAP_TO_RUN: called directly from controller (user presses button)
     * For AUTOMATION: called by Scene Engine triggers (schedule, device status change)
     *
     * @param tenantId tenant context
     * @param scene the scene to execute
     * @param triggerType how the scene was triggered (MANUAL, SCHEDULE, DEVICE_STATUS)
     * @return execution log entry
     */
    SmartSceneLog executeScene(TenantId tenantId, SmartScene scene, String triggerType);
}
