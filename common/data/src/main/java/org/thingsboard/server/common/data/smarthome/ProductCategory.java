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
import org.thingsboard.server.common.data.id.ProductCategoryId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.validation.Length;
import org.thingsboard.server.common.data.validation.NoXss;

import java.io.Serial;

@Data
@Builder
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ProductCategory extends BaseData<ProductCategoryId> implements HasTenantId, HasName, HasVersion {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "Tenant that owns this category.", accessMode = Schema.AccessMode.READ_ONLY)
    private TenantId tenantId;

    @NoXss
    @Length(min = 1, max = 64)
    @Schema(description = "Unique category code (e.g., 'dj' for Light, 'kg' for Switch).", example = "dj")
    private String code;

    @NoXss
    @Length(min = 1, max = 255)
    @Schema(description = "Human-readable category name.", example = "Light")
    private String name;

    @Schema(description = "Category icon URL or identifier.")
    private String icon;

    @Schema(description = "Parent category ID for sub-categories.")
    private ProductCategoryId parentId;

    @Schema(description = "Standard DP set (JSON array of default data point definitions for this category).")
    private JsonNode standardDpSet;

    @Schema(description = "Sort order for display.")
    private int sortOrder;

    @Schema(description = "Version for optimistic locking.", accessMode = Schema.AccessMode.READ_ONLY)
    private Long version;

    public ProductCategory() {}

    public ProductCategory(ProductCategoryId id) {
        super(id);
    }

    public ProductCategory(ProductCategory category) {
        super(category.getId());
        this.createdTime = category.getCreatedTime();
        this.tenantId = category.getTenantId();
        this.code = category.getCode();
        this.name = category.getName();
        this.icon = category.getIcon();
        this.parentId = category.getParentId();
        this.standardDpSet = category.getStandardDpSet();
        this.sortOrder = category.getSortOrder();
        this.version = category.getVersion();
    }
}
