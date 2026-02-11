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
import org.springframework.transaction.annotation.Transactional;
import org.thingsboard.server.common.data.EntityType;
import org.thingsboard.server.common.data.id.EntityId;
import org.thingsboard.server.common.data.id.HasId;
import org.thingsboard.server.common.data.id.ProductCategoryId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.page.PageData;
import org.thingsboard.server.common.data.page.PageLink;
import org.thingsboard.server.common.data.smarthome.ProductCategory;
import org.thingsboard.server.dao.entity.AbstractEntityService;
import org.thingsboard.server.dao.service.Validator;

import java.util.Optional;

import static org.thingsboard.server.dao.service.Validator.validateId;

@Service("ProductCategoryDaoService")
@Slf4j
@RequiredArgsConstructor
public class ProductCategoryServiceImpl extends AbstractEntityService implements ProductCategoryService {

    private static final String INCORRECT_CATEGORY_ID = "Incorrect productCategoryId ";
    private static final String INCORRECT_TENANT_ID = "Incorrect tenantId ";

    private final ProductCategoryDao productCategoryDao;

    @Override
    public ProductCategory findProductCategoryById(TenantId tenantId, ProductCategoryId categoryId) {
        log.trace("Executing findProductCategoryById [{}]", categoryId);
        validateId(categoryId, id -> INCORRECT_CATEGORY_ID + id);
        return productCategoryDao.findById(tenantId, categoryId.getId());
    }

    @Override
    public ProductCategory findProductCategoryByCode(TenantId tenantId, String code) {
        log.trace("Executing findProductCategoryByCode [{}]", code);
        return productCategoryDao.findByTenantIdAndCode(tenantId.getId(), code).orElse(null);
    }

    @Override
    public ProductCategory saveProductCategory(ProductCategory category) {
        log.trace("Executing saveProductCategory [{}]", category);
        return productCategoryDao.save(category.getTenantId(), category);
    }

    @Override
    public PageData<ProductCategory> findProductCategories(TenantId tenantId, PageLink pageLink) {
        log.trace("Executing findProductCategories, tenantId [{}], pageLink [{}]", tenantId, pageLink);
        validateId(tenantId, id -> INCORRECT_TENANT_ID + id);
        Validator.validatePageLink(pageLink);
        return productCategoryDao.findByTenantId(tenantId.getId(), pageLink);
    }

    @Override
    @Transactional
    public void deleteProductCategory(TenantId tenantId, ProductCategoryId categoryId) {
        log.trace("Executing deleteProductCategory [{}]", categoryId);
        validateId(categoryId, id -> INCORRECT_CATEGORY_ID + id);
        productCategoryDao.removeById(tenantId, categoryId.getId());
    }

    @Override
    public Optional<HasId<?>> findEntity(TenantId tenantId, EntityId entityId) {
        return Optional.ofNullable(findProductCategoryById(tenantId, new ProductCategoryId(entityId.getId())));
    }

    @Override
    public EntityType getEntityType() {
        return EntityType.PRODUCT_CATEGORY;
    }

}
