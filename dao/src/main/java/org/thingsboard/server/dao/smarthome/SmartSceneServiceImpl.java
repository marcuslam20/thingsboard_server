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

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.smarthome.SceneType;
import org.thingsboard.server.common.data.smarthome.SmartScene;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class SmartSceneServiceImpl implements SmartSceneService {

    private final SmartSceneDao smartSceneDao;

    @Override
    public SmartScene createScene(SmartScene scene) {
        log.trace("Executing createScene [{}]", scene);
        return smartSceneDao.save(scene);
    }

    @Override
    public SmartScene updateScene(SmartScene scene) {
        log.trace("Executing updateScene [{}]", scene);
        return smartSceneDao.save(scene);
    }

    @Override
    public Optional<SmartScene> findById(UUID sceneId) {
        log.trace("Executing findById [{}]", sceneId);
        return smartSceneDao.findById(sceneId);
    }

    @Override
    public List<SmartScene> findBySmartHomeId(SmartHomeId smartHomeId) {
        log.trace("Executing findBySmartHomeId [{}]", smartHomeId);
        return smartSceneDao.findBySmartHomeId(smartHomeId.getId());
    }

    @Override
    public List<SmartScene> findBySmartHomeIdAndType(SmartHomeId smartHomeId, SceneType sceneType) {
        log.trace("Executing findBySmartHomeIdAndType [homeId={}, type={}]", smartHomeId, sceneType);
        return smartSceneDao.findBySmartHomeIdAndSceneType(smartHomeId.getId(), sceneType.name());
    }

    @Override
    public void deleteScene(UUID sceneId) {
        log.trace("Executing deleteScene [{}]", sceneId);
        smartSceneDao.removeById(sceneId);
    }

    @Override
    public SmartScene enableScene(UUID sceneId) {
        log.trace("Executing enableScene [{}]", sceneId);
        SmartScene scene = smartSceneDao.findById(sceneId)
                .orElseThrow(() -> new IllegalArgumentException("Scene not found: " + sceneId));
        scene.setEnabled(true);
        return smartSceneDao.save(scene);
    }

    @Override
    public SmartScene disableScene(UUID sceneId) {
        log.trace("Executing disableScene [{}]", sceneId);
        SmartScene scene = smartSceneDao.findById(sceneId)
                .orElseThrow(() -> new IllegalArgumentException("Scene not found: " + sceneId));
        scene.setEnabled(false);
        return smartSceneDao.save(scene);
    }
}
