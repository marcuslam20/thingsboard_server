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

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.thingsboard.server.queue.util.TbSceneEngineComponent;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentSkipListMap;

/**
 * In-memory schedule index — sorted by trigger time for fast scanning.
 *
 * Conceptually identical to Redis Sorted Set (ZSET):
 *   ZADD scene:schedule <score=nextTriggerTime> <member=sceneId>
 *   ZRANGEBYSCORE scene:schedule 0 <now>  ← find all due scenes
 *
 * Implementation: ConcurrentSkipListMap<Long, Set<SceneScheduleEntry>>
 *   Key = nextTriggerTime (epoch ms)
 *   Value = entries with that trigger time (multiple scenes can share same time)
 *
 * Phase 2B migration: replace this class with Redis ZSET calls via Valkey/Jedis.
 * All other code (TimeScanner, ScheduleCalculator) stays unchanged.
 */
@Slf4j
@Component
@TbSceneEngineComponent
public class ScheduleCache {

    // Sorted by trigger time — headMap(now) gives all due entries
    private final ConcurrentSkipListMap<Long, List<SceneScheduleEntry>> scheduleIndex = new ConcurrentSkipListMap<>();

    // Quick lookup: sceneId → entry (for remove/update)
    private final ConcurrentHashMap<UUID, SceneScheduleEntry> sceneMap = new ConcurrentHashMap<>();

    /**
     * Add or update a scene's schedule in the cache.
     * If scene already exists, removes old entry first.
     */
    public void put(SceneScheduleEntry entry) {
        // Remove old entry if exists
        remove(entry.getSceneId());

        // Add to sorted index
        scheduleIndex.computeIfAbsent(entry.getNextTriggerTime(), k -> new ArrayList<>())
                .add(entry);
        sceneMap.put(entry.getSceneId(), entry);

        log.debug("Schedule cache: added scene {} at triggerTime={}",
                entry.getSceneId(), entry.getNextTriggerTime());
    }

    /**
     * Remove a scene from the cache (when scene deleted or disabled).
     */
    public void remove(UUID sceneId) {
        SceneScheduleEntry existing = sceneMap.remove(sceneId);
        if (existing != null) {
            List<SceneScheduleEntry> entries = scheduleIndex.get(existing.getNextTriggerTime());
            if (entries != null) {
                entries.removeIf(e -> e.getSceneId().equals(sceneId));
                if (entries.isEmpty()) {
                    scheduleIndex.remove(existing.getNextTriggerTime());
                }
            }
            log.debug("Schedule cache: removed scene {}", sceneId);
        }
    }

    /**
     * Find all scenes that should trigger now (nextTriggerTime <= currentTime).
     *
     * Equivalent to Redis: ZRANGEBYSCORE scene:schedule 0 <currentTime>
     *
     * @return list of due entries (removed from cache — caller must re-add with next trigger time)
     */
    public List<SceneScheduleEntry> pollDueEntries(long currentTime) {
        List<SceneScheduleEntry> dueEntries = new ArrayList<>();

        // headMap(currentTime, inclusive=true) → all keys <= currentTime
        Map<Long, List<SceneScheduleEntry>> dueMap = scheduleIndex.headMap(currentTime, true);

        for (Map.Entry<Long, List<SceneScheduleEntry>> mapEntry : dueMap.entrySet()) {
            dueEntries.addAll(mapEntry.getValue());
            for (SceneScheduleEntry entry : mapEntry.getValue()) {
                sceneMap.remove(entry.getSceneId());
            }
        }

        // Remove all due keys from index
        if (!dueEntries.isEmpty()) {
            dueMap.clear(); // ConcurrentSkipListMap.headMap is a view — clear removes from original
            log.info("Schedule cache: polled {} due entries", dueEntries.size());
        }

        return dueEntries;
    }

    /**
     * Get total number of scheduled scenes (for monitoring/logging).
     */
    public int size() {
        return sceneMap.size();
    }
}
