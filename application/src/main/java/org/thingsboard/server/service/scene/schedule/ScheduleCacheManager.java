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
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thingsboard.server.common.data.smarthome.SmartScene;
import org.thingsboard.server.dao.smarthome.SmartSceneService;
import org.thingsboard.server.queue.util.TbCoreComponent;

import java.util.List;
import java.util.UUID;

/**
 * Manages sync between SmartScene DB and ScheduleCache.
 *
 * Called when:
 * 1. Server starts → load all AUTOMATION scenes with SCHEDULE conditions
 * 2. Scene created/updated → add/update schedule in cache
 * 3. Scene deleted → remove from cache
 * 4. Scene enabled/disabled → add to or remove from cache
 *
 * Phase 2A: direct method calls (same JVM)
 * Phase 2B: produce scene.mgmt message to Kafka → Scene Engine consumes → syncs cache
 */
@Slf4j
@Service
@TbCoreComponent
@RequiredArgsConstructor
public class ScheduleCacheManager {

    private final ScheduleCache scheduleCache;
    private final ScheduleCalculator scheduleCalculator;
    private final SmartSceneService smartSceneService;

    /**
     * On server startup: load all enabled AUTOMATION scenes with SCHEDULE conditions
     * and populate the cache.
     */
    @PostConstruct
    public void init() {
        log.info("Loading scheduled scenes into cache...");
        List<SmartScene> automationScenes = smartSceneService.findAllAutomationScenes();
        int count = 0;
        for (SmartScene scene : automationScenes) {
            if (scene.isEnabled()) {
                if (syncSceneToCache(scene)) {
                    count++;
                }
            }
        }
        log.info("Loaded {} scheduled scenes into cache (total automation scenes: {})",
                count, automationScenes.size());
    }

    /**
     * Called when a scene is created or updated.
     * Extracts SCHEDULE condition, calculates next trigger, adds to cache.
     */
    public void onSceneCreatedOrUpdated(SmartScene scene) {
        if (!"AUTOMATION".equals(scene.getSceneType().name())) {
            return; // only AUTOMATION scenes have schedules
        }
        if (!scene.isEnabled()) {
            scheduleCache.remove(scene.getId());
            return;
        }
        syncSceneToCache(scene);
    }

    /**
     * Called when a scene is deleted.
     */
    public void onSceneDeleted(UUID sceneId) {
        scheduleCache.remove(sceneId);
    }

    /**
     * Called when a scene is enabled.
     */
    public void onSceneEnabled(SmartScene scene) {
        syncSceneToCache(scene);
    }

    /**
     * Called when a scene is disabled.
     */
    public void onSceneDisabled(UUID sceneId) {
        scheduleCache.remove(sceneId);
    }

    /**
     * Extract SCHEDULE condition from scene, calculate next trigger, add to cache.
     *
     * @return true if scene has a SCHEDULE condition and was added to cache
     */
    private boolean syncSceneToCache(SmartScene scene) {
        JsonNode scheduleCondition = findScheduleCondition(scene);
        if (scheduleCondition == null) {
            return false;
        }

        long nextTrigger = scheduleCalculator.calculateNextTriggerTime(scheduleCondition);
        if (nextTrigger <= 0) {
            log.debug("Scene '{}' has no future trigger time, skipping", scene.getName());
            return false;
        }

        SceneScheduleEntry entry = new SceneScheduleEntry(
                scene.getId(),
                scene.getTenantId().getId(),
                nextTrigger
        );
        scheduleCache.put(entry);
        log.debug("Scene '{}' scheduled for trigger at {}", scene.getName(), nextTrigger);
        return true;
    }

    /**
     * Find the first SCHEDULE condition in a scene's conditions array.
     *
     * conditions JSON format:
     * [
     *   { "conditionType": "SCHEDULE", "loops": "0111110", "time": "18:00", ... },
     *   { "conditionType": "DEVICE_STATUS", ... }
     * ]
     */
    private JsonNode findScheduleCondition(SmartScene scene) {
        JsonNode conditions = scene.getConditions();
        if (conditions == null || !conditions.isArray()) {
            return null;
        }
        for (JsonNode condition : conditions) {
            if (condition.has("conditionType")
                    && "SCHEDULE".equals(condition.get("conditionType").asText())) {
                return condition;
            }
        }
        return null;
    }
}
