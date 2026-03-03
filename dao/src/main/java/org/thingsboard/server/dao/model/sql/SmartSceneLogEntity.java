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
package org.thingsboard.server.dao.model.sql;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import org.thingsboard.server.common.data.smarthome.SmartSceneLog;
import org.thingsboard.server.dao.model.ModelConstants;
import org.thingsboard.server.dao.util.mapping.JsonConverter;

import java.util.UUID;

@Data
@Entity
@Table(name = ModelConstants.SMART_SCENE_LOG_TABLE_NAME)
public class SmartSceneLogEntity {

    @Id
    @Column(name = ModelConstants.ID_PROPERTY, columnDefinition = "uuid")
    private UUID id;

    @Column(name = ModelConstants.CREATED_TIME_PROPERTY, updatable = false)
    private long createdTime;

    @Column(name = ModelConstants.SMART_SCENE_LOG_SCENE_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID sceneId;

    @Column(name = ModelConstants.SMART_SCENE_LOG_TRIGGER_TYPE_PROPERTY)
    private String triggerType;

    @Column(name = ModelConstants.SMART_SCENE_LOG_STATUS_PROPERTY)
    private String status;

    @Convert(converter = JsonConverter.class)
    @Column(name = ModelConstants.SMART_SCENE_LOG_EXECUTION_DETAILS_PROPERTY, columnDefinition = "jsonb")
    private JsonNode executionDetails;

    public SmartSceneLogEntity() {}

    public SmartSceneLogEntity(SmartSceneLog log) {
        this.id = log.getId();
        this.createdTime = log.getCreatedTime();
        this.sceneId = log.getSceneId();
        this.triggerType = log.getTriggerType();
        this.status = log.getStatus();
        this.executionDetails = log.getExecutionDetails();
    }

    public SmartSceneLog toData() {
        SmartSceneLog data = new SmartSceneLog();
        data.setId(id);
        data.setCreatedTime(createdTime);
        data.setSceneId(sceneId);
        data.setTriggerType(triggerType);
        data.setStatus(status);
        data.setExecutionDetails(executionDetails);
        return data;
    }
}
