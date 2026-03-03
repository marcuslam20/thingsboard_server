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

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.common.data.smarthome.SmartHome;
import org.thingsboard.server.dao.model.BaseVersionedEntity;
import org.thingsboard.server.dao.model.ModelConstants;

import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = ModelConstants.SMART_HOME_TABLE_NAME)
public class SmartHomeEntity extends BaseVersionedEntity<SmartHome> {

    @Column(name = ModelConstants.TENANT_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    @Column(name = ModelConstants.SMART_HOME_OWNER_USER_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID ownerUserId;

    @Column(name = ModelConstants.NAME_PROPERTY, nullable = false)
    private String name;

    @Column(name = ModelConstants.SMART_HOME_GEO_NAME_PROPERTY)
    private String geoName;

    @Column(name = ModelConstants.SMART_HOME_LATITUDE_PROPERTY)
    private Double latitude;

    @Column(name = ModelConstants.SMART_HOME_LONGITUDE_PROPERTY)
    private Double longitude;

    @Column(name = ModelConstants.SMART_HOME_TIMEZONE_PROPERTY)
    private String timezone;

    @Column(name = ModelConstants.ADDITIONAL_INFO_PROPERTY)
    private String additionalInfo;

    public SmartHomeEntity() {
        super();
    }

    public SmartHomeEntity(SmartHome smartHome) {
        super(smartHome);
        this.tenantId = getTenantUuid(smartHome.getTenantId());
        this.ownerUserId = getUuid(smartHome.getOwnerUserId());
        this.name = smartHome.getName();
        this.geoName = smartHome.getGeoName();
        this.latitude = smartHome.getLatitude();
        this.longitude = smartHome.getLongitude();
        this.timezone = smartHome.getTimezone();
        this.additionalInfo = smartHome.getAdditionalInfo();
    }

    @Override
    public SmartHome toData() {
        SmartHome smartHome = new SmartHome(new SmartHomeId(id));
        smartHome.setCreatedTime(createdTime);
        smartHome.setVersion(version);
        smartHome.setTenantId(TenantId.fromUUID(tenantId));
        smartHome.setOwnerUserId(new UserId(ownerUserId));
        smartHome.setName(name);
        smartHome.setGeoName(geoName);
        smartHome.setLatitude(latitude);
        smartHome.setLongitude(longitude);
        smartHome.setTimezone(timezone);
        smartHome.setAdditionalInfo(additionalInfo);
        return smartHome;
    }
}
