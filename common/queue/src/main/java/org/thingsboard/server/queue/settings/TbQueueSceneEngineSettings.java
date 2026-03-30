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
package org.thingsboard.server.queue.settings;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

/**
 * Reads queue.scene-engine.* config from thingsboard.yml.
 *
 * Maps to:
 *   queue:
 *     scene-engine:
 *       topic: tb_scene_engine                          → trigger messages (execute scene)
 *       notifications_topic: tb_scene_engine.notifications → management (CRUD sync)
 *       partitions: 10
 */
@Lazy
@Data
@Component
public class TbQueueSceneEngineSettings {

    @Value("${queue.scene-engine.topic:tb_scene_engine}")
    private String topic;

    @Value("${queue.scene-engine.partitions:10}")
    private int partitions;
}
