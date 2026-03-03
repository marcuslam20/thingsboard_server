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
package org.thingsboard.server.common.data.smarthome;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.thingsboard.server.common.data.BaseData;
import org.thingsboard.server.common.data.HasName;
import org.thingsboard.server.common.data.HasTenantId;
import org.thingsboard.server.common.data.HasVersion;
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.common.data.validation.Length;
import org.thingsboard.server.common.data.validation.NoXss;

import java.io.Serial;

@Data
@Builder
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SmartHome extends BaseData<SmartHomeId> implements HasTenantId, HasName, HasVersion {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "Tenant that owns this smart home.", accessMode = Schema.AccessMode.READ_ONLY)
    private TenantId tenantId;

    @Schema(description = "User who created/owns this smart home.")
    private UserId ownerUserId;

    @NoXss
    @Length(min = 1, max = 255)
    @Schema(description = "Smart home name.", example = "My Home")
    private String name;

    @NoXss
    @Length(max = 255)
    @Schema(description = "Geographic location name.", example = "Ho Chi Minh City")
    private String geoName;

    @Schema(description = "Latitude of the smart home location.")
    private Double latitude;

    @Schema(description = "Longitude of the smart home location.")
    private Double longitude;

    @NoXss
    @Length(max = 64)
    @Schema(description = "Timezone of the smart home.", example = "Asia/Ho_Chi_Minh")
    private String timezone;

    @Schema(description = "Additional info in JSON format.")
    private String additionalInfo;

    @Schema(description = "Version for optimistic locking.", accessMode = Schema.AccessMode.READ_ONLY)
    private Long version;

    public SmartHome() {}

    public SmartHome(SmartHomeId id) {
        super(id);
    }

    public SmartHome(SmartHome smartHome) {
        super(smartHome.getId());
        this.createdTime = smartHome.getCreatedTime();
        this.tenantId = smartHome.getTenantId();
        this.ownerUserId = smartHome.getOwnerUserId();
        this.name = smartHome.getName();
        this.geoName = smartHome.getGeoName();
        this.latitude = smartHome.getLatitude();
        this.longitude = smartHome.getLongitude();
        this.timezone = smartHome.getTimezone();
        this.additionalInfo = smartHome.getAdditionalInfo();
        this.version = smartHome.getVersion();
    }
}
