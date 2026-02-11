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
package org.thingsboard.server.dao.sql.smarthome;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.thingsboard.server.common.data.smarthome.SmartScene;
import org.thingsboard.server.dao.model.sql.SmartSceneEntity;
import org.thingsboard.server.dao.smarthome.SmartSceneDao;
import org.thingsboard.server.dao.util.SqlDao;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@SqlDao
@RequiredArgsConstructor
public class JpaSmartSceneDao implements SmartSceneDao {

    private final SmartSceneRepository repository;

    @Override
    public SmartScene save(SmartScene scene) {
        SmartSceneEntity entity = new SmartSceneEntity(scene);
        if (entity.getId() == null) {
            entity.setId(UUID.randomUUID());
            entity.setCreatedTime(System.currentTimeMillis());
        }
        return repository.save(entity).toData();
    }

    @Override
    public Optional<SmartScene> findById(UUID id) {
        return repository.findById(id).map(SmartSceneEntity::toData);
    }

    @Override
    public List<SmartScene> findBySmartHomeId(UUID smartHomeId) {
        return repository.findBySmartHomeId(smartHomeId).stream()
                .map(SmartSceneEntity::toData)
                .collect(Collectors.toList());
    }

    @Override
    public List<SmartScene> findBySmartHomeIdAndSceneType(UUID smartHomeId, String sceneType) {
        return repository.findBySmartHomeIdAndSceneType(smartHomeId, sceneType).stream()
                .map(SmartSceneEntity::toData)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void removeById(UUID id) {
        repository.deleteById(id);
    }
}
