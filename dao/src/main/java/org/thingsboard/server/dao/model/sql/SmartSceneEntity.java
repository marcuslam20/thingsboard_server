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
import jakarta.persistence.Version;
import lombok.Data;
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.smarthome.SceneType;
import org.thingsboard.server.common.data.smarthome.SmartScene;
import org.thingsboard.server.dao.model.ModelConstants;
import org.thingsboard.server.dao.util.mapping.JsonConverter;

import java.util.UUID;

@Data
@Entity
@Table(name = ModelConstants.SMART_SCENE_TABLE_NAME)
public class SmartSceneEntity {

    @Id
    @Column(name = ModelConstants.ID_PROPERTY, columnDefinition = "uuid")
    private UUID id;

    @Column(name = ModelConstants.CREATED_TIME_PROPERTY, updatable = false)
    private long createdTime;

    @Column(name = ModelConstants.TENANT_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    @Column(name = ModelConstants.SMART_SCENE_SMART_HOME_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID smartHomeId;

    @Column(name = ModelConstants.NAME_PROPERTY, nullable = false)
    private String name;

    @Column(name = ModelConstants.SMART_SCENE_SCENE_TYPE_PROPERTY, nullable = false)
    private String sceneType;

    @Column(name = ModelConstants.SMART_SCENE_ENABLED_PROPERTY)
    private boolean enabled;

    @Column(name = ModelConstants.SMART_SCENE_ICON_PROPERTY)
    private String icon;

    @Convert(converter = JsonConverter.class)
    @Column(name = ModelConstants.SMART_SCENE_CONDITIONS_PROPERTY, columnDefinition = "jsonb")
    private JsonNode conditions;

    @Column(name = ModelConstants.SMART_SCENE_CONDITION_LOGIC_PROPERTY)
    private String conditionLogic;

    @Convert(converter = JsonConverter.class)
    @Column(name = ModelConstants.SMART_SCENE_ACTIONS_PROPERTY, nullable = false, columnDefinition = "jsonb")
    private JsonNode actions;

    @Convert(converter = JsonConverter.class)
    @Column(name = ModelConstants.SMART_SCENE_EFFECTIVE_TIME_PROPERTY, columnDefinition = "jsonb")
    private JsonNode effectiveTime;

    @Column(name = ModelConstants.ADDITIONAL_INFO_PROPERTY, columnDefinition = "varchar")
    private String additionalInfo;

    @Version
    @Column(name = ModelConstants.VERSION_PROPERTY)
    private Long version;

    public SmartSceneEntity() {}

    public SmartSceneEntity(SmartScene scene) {
        this.id = scene.getId();
        this.createdTime = scene.getCreatedTime();
        this.tenantId = scene.getTenantId() != null ? scene.getTenantId().getId() : null;
        this.smartHomeId = scene.getSmartHomeId() != null ? scene.getSmartHomeId().getId() : null;
        this.name = scene.getName();
        this.sceneType = scene.getSceneType() != null ? scene.getSceneType().name() : null;
        this.enabled = scene.isEnabled();
        this.icon = scene.getIcon();
        this.conditions = scene.getConditions();
        this.conditionLogic = scene.getConditionLogic();
        this.actions = scene.getActions();
        this.effectiveTime = scene.getEffectiveTime();
        this.additionalInfo = scene.getAdditionalInfo();
        this.version = scene.getVersion();
    }

    public SmartScene toData() {
        SmartScene data = new SmartScene();
        data.setId(id);
        data.setCreatedTime(createdTime);
        data.setTenantId(TenantId.fromUUID(tenantId));
        data.setSmartHomeId(new SmartHomeId(smartHomeId));
        data.setName(name);
        data.setSceneType(sceneType != null ? SceneType.valueOf(sceneType) : null);
        data.setEnabled(enabled);
        data.setIcon(icon);
        data.setConditions(conditions);
        data.setConditionLogic(conditionLogic);
        data.setActions(actions);
        data.setEffectiveTime(effectiveTime);
        data.setAdditionalInfo(additionalInfo);
        data.setVersion(version);
        return data;
    }
}
