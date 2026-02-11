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
import org.thingsboard.server.common.data.smarthome.SmartSceneLog;

import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class SmartSceneLogServiceImpl implements SmartSceneLogService {

    private final SmartSceneLogDao smartSceneLogDao;

    @Override
    public SmartSceneLog logExecution(SmartSceneLog sceneLog) {
        log.trace("Executing logExecution [{}]", sceneLog);
        return smartSceneLogDao.save(sceneLog);
    }

    @Override
    public List<SmartSceneLog> findBySceneId(UUID sceneId) {
        log.trace("Executing findBySceneId [{}]", sceneId);
        return smartSceneLogDao.findBySceneId(sceneId);
    }
}
