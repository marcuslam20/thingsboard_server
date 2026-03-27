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

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.thingsboard.server.dao.model.sql.SmartSceneLogEntity;

import java.util.List;
import java.util.UUID;

public interface SmartSceneLogRepository extends JpaRepository<SmartSceneLogEntity, UUID> {

    List<SmartSceneLogEntity> findBySceneIdOrderByCreatedTimeDesc(UUID sceneId);

    @Modifying
    @Transactional
    @Query(value = "UPDATE smart_scene_log SET status = :status, execution_details = CAST(:details AS jsonb) WHERE id = :id",
            nativeQuery = true)
    void updateStatus(@Param("id") UUID id, @Param("status") String status, @Param("details") String details);
}
