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
package org.thingsboard.server.dao.smarthome;

import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.smarthome.SceneType;
import org.thingsboard.server.common.data.smarthome.SmartScene;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SmartSceneService {

    SmartScene createScene(SmartScene scene);

    SmartScene updateScene(SmartScene scene);

    Optional<SmartScene> findById(UUID sceneId);

    List<SmartScene> findBySmartHomeId(SmartHomeId smartHomeId);

    List<SmartScene> findBySmartHomeIdAndType(SmartHomeId smartHomeId, SceneType sceneType);

    void deleteScene(UUID sceneId);

    SmartScene enableScene(UUID sceneId);

    SmartScene disableScene(UUID sceneId);
}
