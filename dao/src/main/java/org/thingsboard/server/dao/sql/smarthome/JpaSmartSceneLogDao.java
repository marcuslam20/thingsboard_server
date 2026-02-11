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
import org.thingsboard.server.common.data.smarthome.SmartSceneLog;
import org.thingsboard.server.dao.model.sql.SmartSceneLogEntity;
import org.thingsboard.server.dao.smarthome.SmartSceneLogDao;
import org.thingsboard.server.dao.util.SqlDao;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@SqlDao
@RequiredArgsConstructor
public class JpaSmartSceneLogDao implements SmartSceneLogDao {

    private final SmartSceneLogRepository repository;

    @Override
    public SmartSceneLog save(SmartSceneLog log) {
        SmartSceneLogEntity entity = new SmartSceneLogEntity(log);
        if (entity.getId() == null) {
            entity.setId(UUID.randomUUID());
            entity.setCreatedTime(System.currentTimeMillis());
        }
        return repository.save(entity).toData();
    }

    @Override
    public List<SmartSceneLog> findBySceneId(UUID sceneId) {
        return repository.findBySceneIdOrderByCreatedTimeDesc(sceneId).stream()
                .map(SmartSceneLogEntity::toData)
                .collect(Collectors.toList());
    }
}
