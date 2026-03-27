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

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

/**
 * One entry in the schedule cache.
 * Represents: "scene X should trigger at time Y".
 *
 * Phase 2A: stored in ConcurrentSkipListMap (in-memory)
 * Phase 2B: stored in Redis Sorted Set (score = nextTriggerTime, member = sceneId)
 */
@Data
@AllArgsConstructor
public class SceneScheduleEntry {
    private UUID sceneId;
    private UUID tenantId;
    private long nextTriggerTime;   // epoch ms — when to trigger next
}
