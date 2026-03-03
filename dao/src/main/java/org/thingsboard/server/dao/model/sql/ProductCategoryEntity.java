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
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLJsonPGObjectJsonbType;
import org.thingsboard.server.common.data.id.ProductCategoryId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.smarthome.ProductCategory;
import org.thingsboard.server.dao.model.BaseVersionedEntity;
import org.thingsboard.server.dao.model.ModelConstants;
import org.thingsboard.server.dao.util.mapping.JsonConverter;

import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = ModelConstants.PRODUCT_CATEGORY_TABLE_NAME)
public class ProductCategoryEntity extends BaseVersionedEntity<ProductCategory> {

    @Column(name = ModelConstants.TENANT_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID tenantId;

    @Column(name = ModelConstants.PRODUCT_CATEGORY_CODE_PROPERTY, nullable = false)
    private String code;

    @Column(name = ModelConstants.NAME_PROPERTY, nullable = false)
    private String name;

    @Column(name = ModelConstants.PRODUCT_CATEGORY_ICON_PROPERTY)
    private String icon;

    @Column(name = ModelConstants.PRODUCT_CATEGORY_PARENT_ID_PROPERTY, columnDefinition = "uuid")
    private UUID parentId;

    @Convert(converter = JsonConverter.class)
    @JdbcType(PostgreSQLJsonPGObjectJsonbType.class)
    @Column(name = ModelConstants.PRODUCT_CATEGORY_STANDARD_DP_SET_PROPERTY, columnDefinition = "jsonb")
    private JsonNode standardDpSet;

    @Column(name = ModelConstants.PRODUCT_CATEGORY_SORT_ORDER_PROPERTY)
    private int sortOrder;

    public ProductCategoryEntity() {
        super();
    }

    public ProductCategoryEntity(ProductCategory category) {
        super(category);
        this.tenantId = getTenantUuid(category.getTenantId());
        this.code = category.getCode();
        this.name = category.getName();
        this.icon = category.getIcon();
        this.parentId = getUuid(category.getParentId());
        this.standardDpSet = category.getStandardDpSet();
        this.sortOrder = category.getSortOrder();
    }

    @Override
    public ProductCategory toData() {
        ProductCategory category = new ProductCategory(new ProductCategoryId(id));
        category.setCreatedTime(createdTime);
        category.setVersion(version);
        category.setTenantId(TenantId.fromUUID(tenantId));
        category.setCode(code);
        category.setName(name);
        category.setIcon(icon);
        category.setParentId(getEntityId(parentId, ProductCategoryId::new));
        category.setStandardDpSet(standardDpSet);
        category.setSortOrder(sortOrder);
        return category;
    }
}
