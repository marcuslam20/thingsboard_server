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

import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.thingsboard.server.common.data.BaseData;
import org.thingsboard.server.common.data.HasName;
import org.thingsboard.server.common.data.HasTenantId;
import org.thingsboard.server.common.data.HasVersion;
import org.thingsboard.server.common.data.id.DataPointId;
import org.thingsboard.server.common.data.id.DeviceProfileId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.validation.Length;
import org.thingsboard.server.common.data.validation.NoXss;

import java.io.Serial;

@Data
@Builder
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class DataPoint extends BaseData<DataPointId> implements HasTenantId, HasName, HasVersion {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "Tenant that owns this data point.", accessMode = Schema.AccessMode.READ_ONLY)
    private TenantId tenantId;

    @Schema(description = "Device profile (product) this data point belongs to.")
    private DeviceProfileId deviceProfileId;

    @Schema(description = "Tuya-style numeric DP ID (1-255).", example = "1")
    private int dpId;

    @NoXss
    @Length(min = 1, max = 64)
    @Schema(description = "DP code identifier (e.g., 'switch_led', 'bright_value').", example = "switch_led")
    private String code;

    @NoXss
    @Length(min = 1, max = 255)
    @Schema(description = "Human-readable DP name.", example = "LED Switch")
    private String name;

    @Schema(description = "Data point type: BOOLEAN, VALUE, ENUM, STRING, RAW, FAULT.", example = "BOOLEAN")
    private DpType dpType;

    @Schema(description = "Transmission mode: RW (send-and-report), RO (report-only), WO (send-only).", example = "RW")
    private DpMode mode;

    @Schema(description = "Type-specific constraints as JSON. For VALUE: {min, max, step, scale}. For ENUM: {range: [...]}. For STRING: {maxlen}.")
    private JsonNode constraints;

    @Schema(description = "Whether this DP is from a standard instruction set.")
    private boolean isStandard;

    @Schema(description = "Sort order for display.")
    private int sortOrder;

    @Schema(description = "Version for optimistic locking.", accessMode = Schema.AccessMode.READ_ONLY)
    private Long version;

    public DataPoint() {}

    public DataPoint(DataPointId id) {
        super(id);
    }

    public DataPoint(DataPoint dp) {
        super(dp.getId());
        this.createdTime = dp.getCreatedTime();
        this.tenantId = dp.getTenantId();
        this.deviceProfileId = dp.getDeviceProfileId();
        this.dpId = dp.getDpId();
        this.code = dp.getCode();
        this.name = dp.getName();
        this.dpType = dp.getDpType();
        this.mode = dp.getMode();
        this.constraints = dp.getConstraints();
        this.isStandard = dp.isStandard();
        this.sortOrder = dp.getSortOrder();
        this.version = dp.getVersion();
    }
}
