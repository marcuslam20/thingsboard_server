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

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.smarthome.SmartScene;
import org.thingsboard.server.dao.smarthome.SmartSceneService;
import org.thingsboard.server.queue.util.TbCoreComponent;
import org.thingsboard.server.service.scene.SceneExecutionService;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Scans the schedule cache every 15 seconds for scenes that are due to trigger.
 *
 * Flow:
 *   1. pollDueEntries(now) → get all scenes with nextTriggerTime <= now
 *   2. For each scene: load from DB → verify enabled → execute actions
 *   3. Calculate next trigger time → put back into cache
 *
 * Phase 2A: @Scheduled + direct call to SceneExecutionService (same JVM)
 * Phase 2B: produce scene.trigger message to Kafka → Scene Engine consumes
 */
@Slf4j
@Service
@TbCoreComponent
@RequiredArgsConstructor
public class TimeScanner {

    private final ScheduleCache scheduleCache;
    private final ScheduleCalculator scheduleCalculator;
    private final ScheduleCacheManager scheduleCacheManager;
    private final SceneExecutionService sceneExecutionService;
    private final SmartSceneService smartSceneService;

    /**
     * Runs every 15 seconds. Scans cache for due scenes and executes them.
     *
     * Why 15 seconds?
     * - 1 second: too frequent, wastes CPU on empty scans
     * - 60 seconds: too slow, scenes could be delayed up to 1 minute
     * - 15 seconds: good balance — max delay is 15s, CPU usage negligible
     */
    @Scheduled(fixedDelayString = "${scene.scanner.interval:15000}")
    public void scan() {
        long now = System.currentTimeMillis();
        List<SceneScheduleEntry> dueEntries = scheduleCache.pollDueEntries(now);

        if (dueEntries.isEmpty()) {
            return; // nothing to trigger — most common case
        }

        log.info("TimeScanner: {} scene(s) due for execution", dueEntries.size());

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
     * 1. Load scene from DB (verify it still exists and is enabled)
     * 2. Execute actions
     * 3. Calculate next trigger time and re-add to cache (for recurring schedules)
     */
    private void processEntry(SceneScheduleEntry entry) {
        UUID sceneId = entry.getSceneId();

        // Load fresh from DB — scene might have been modified/deleted since cached
        Optional<SmartScene> sceneOpt = smartSceneService.findById(sceneId);
        if (sceneOpt.isEmpty()) {
            log.debug("Scene {} no longer exists, skipping", sceneId);
            return;
        }

        SmartScene scene = sceneOpt.get();
        if (!scene.isEnabled()) {
            log.debug("Scene '{}' is disabled, skipping", scene.getName());
            return;
        }

        // Execute the scene's actions
        log.info("TimeScanner: triggering scene '{}' (id={})", scene.getName(), sceneId);
        TenantId tenantId = scene.getTenantId();
        sceneExecutionService.executeScene(tenantId, scene, "SCHEDULE");

        // Re-schedule for next occurrence (recurring schedules only)
        reschedule(scene);
    }

    /**
     * After execution, calculate next trigger time and put back into cache.
     * For one-time schedules (loops="0000000"), this will return -1 → not re-added.
     * For recurring schedules, this calculates the next matching day+time.
     */
    private void reschedule(SmartScene scene) {
        // Delegate to ScheduleCacheManager which handles finding the condition
        // and calculating next trigger
        scheduleCacheManager.onSceneCreatedOrUpdated(scene);
    }
}
