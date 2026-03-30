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
package org.thingsboard.server.service.scene.schedule;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.queue.util.TbSceneEngineComponent;
import org.thingsboard.server.service.scene.queue.SceneEngineProducerService;

import java.util.List;

/**
 * Scans the schedule cache every 1 second for scenes that are due to trigger.
 *
 * Phase 2A (old): scan → direct call to SceneExecutionService (same JVM)
 * Phase 2B (now): scan → produce trigger message to queue → SceneEngineConsumerService executes
 *
 * Changed from @TbCoreComponent to @TbSceneEngineComponent:
 *   - Monolithic: still loads (monolith loads all)
 *   - Microservice: loads in Scene Engine container only (not in tb-core)
 */
@Slf4j
@Service
@TbSceneEngineComponent   // ← Changed from @TbCoreComponent
@RequiredArgsConstructor
public class TimeScanner {

    private final ScheduleCache scheduleCache;
    private final ScheduleCacheManager scheduleCacheManager;
    private final SceneEngineProducerService sceneEngineProducerService;   // ← Queue producer (replaces SceneExecutionService)

    @Scheduled(fixedDelayString = "${scene.scanner.interval:1000}")
    public void scan() {
        long now = System.currentTimeMillis();
        List<SceneScheduleEntry> dueEntries = scheduleCache.pollDueEntries(now);

        if (dueEntries.isEmpty()) {
            return;
        }

        log.debug("TimeScanner: {} scene(s) due for execution", dueEntries.size());

        for (SceneScheduleEntry entry : dueEntries) {
            try {
                processEntry(entry);
            } catch (Exception e) {
                log.error("TimeScanner: failed to process scene {}", entry.getSceneId(), e);
            }
        }
    }

    /**
     * Process one due scene entry:
     *
     * OLD (Phase 2A): Load scene from DB → execute directly
     * NEW (Phase 2B): Send trigger message to queue → consumer will load & execute
     *
     * The validation (exists? enabled?) is now done by SceneEngineConsumerService.
     * TimeScanner only needs to send the trigger — separation of concerns.
     */
    private void processEntry(SceneScheduleEntry entry) {
        TenantId tenantId = TenantId.fromUUID(entry.getTenantId());

        // Send trigger message → queue → SceneEngineConsumerService → executeScene()
        sceneEngineProducerService.pushSceneTriggerMsg(tenantId, entry.getSceneId(), "SCHEDULE");

        log.info("TimeScanner: triggered scene {} via queue", entry.getSceneId());

        // Re-schedule for next occurrence (recurring schedules)
        scheduleCacheManager.reschedule(entry.getSceneId());
    }
}
