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
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLJsonPGObjectJsonbType;
import org.thingsboard.server.common.data.id.DataPointId;
import org.thingsboard.server.common.data.id.DeviceProfileId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.smarthome.DataPoint;
import org.thingsboard.server.common.data.smarthome.DpMode;
import org.thingsboard.server.common.data.smarthome.DpType;
import org.thingsboard.server.dao.model.BaseVersionedEntity;
import org.thingsboard.server.dao.model.ModelConstants;
import org.thingsboard.server.dao.util.mapping.JsonConverter;

import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = ModelConstants.DATA_POINT_TABLE_NAME)
public class DataPointEntity extends BaseVersionedEntity<DataPoint> {

    @Column(name = ModelConstants.TENANT_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    @Column(name = ModelConstants.DATA_POINT_DEVICE_PROFILE_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID deviceProfileId;

    @Column(name = ModelConstants.DATA_POINT_DP_ID_PROPERTY, nullable = false)
    private int dpId;

    @Column(name = ModelConstants.DATA_POINT_CODE_PROPERTY, nullable = false)
    private String code;

    @Column(name = ModelConstants.NAME_PROPERTY, nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = ModelConstants.DATA_POINT_DP_TYPE_PROPERTY, nullable = false)
    private DpType dpType;

    @Enumerated(EnumType.STRING)
    @Column(name = ModelConstants.DATA_POINT_MODE_PROPERTY, nullable = false)
    private DpMode mode;

    @Convert(converter = JsonConverter.class)
    @JdbcType(PostgreSQLJsonPGObjectJsonbType.class)
    @Column(name = ModelConstants.DATA_POINT_CONSTRAINTS_PROPERTY, columnDefinition = "jsonb")
    private JsonNode constraints;

    @Column(name = ModelConstants.DATA_POINT_IS_STANDARD_PROPERTY)
    private boolean isStandard;

    @Column(name = ModelConstants.DATA_POINT_SORT_ORDER_PROPERTY)
    private int sortOrder;

    public DataPointEntity() {
        super();
    }

    public DataPointEntity(DataPoint dataPoint) {
        super(dataPoint);
        this.tenantId = getTenantUuid(dataPoint.getTenantId());
        this.deviceProfileId = getUuid(dataPoint.getDeviceProfileId());
        this.dpId = dataPoint.getDpId();
        this.code = dataPoint.getCode();
        this.name = dataPoint.getName();
        this.dpType = dataPoint.getDpType();
        this.mode = dataPoint.getMode();
        this.constraints = dataPoint.getConstraints();
        this.isStandard = dataPoint.isStandard();
        this.sortOrder = dataPoint.getSortOrder();
    }

    @Override
    public DataPoint toData() {
        DataPoint dp = new DataPoint(new DataPointId(id));
        dp.setCreatedTime(createdTime);
        dp.setVersion(version);
        dp.setTenantId(TenantId.fromUUID(tenantId));
        dp.setDeviceProfileId(new DeviceProfileId(deviceProfileId));
        dp.setDpId(dpId);
        dp.setCode(code);
        dp.setName(name);
        dp.setDpType(dpType);
        dp.setMode(mode);
        dp.setConstraints(constraints);
        dp.setStandard(isStandard);
        dp.setSortOrder(sortOrder);
        return dp;
    }
}
