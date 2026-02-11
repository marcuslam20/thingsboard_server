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
package org.thingsboard.server.controller;

import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.thingsboard.server.common.data.exception.ThingsboardException;
import org.thingsboard.server.common.data.id.DataPointId;
import org.thingsboard.server.common.data.id.DeviceProfileId;
import org.thingsboard.server.common.data.id.ProductCategoryId;
import org.thingsboard.server.common.data.page.PageData;
import org.thingsboard.server.common.data.page.PageLink;
import org.thingsboard.server.common.data.smarthome.DataPoint;
import org.thingsboard.server.common.data.smarthome.ProductCategory;
import org.thingsboard.server.dao.smarthome.DataPointService;
import org.thingsboard.server.dao.smarthome.ProductCategoryService;
import org.thingsboard.server.queue.util.TbCoreComponent;
import org.thingsboard.server.service.security.permission.Operation;
import org.thingsboard.server.service.security.permission.Resource;
import org.thingsboard.server.service.smarthome.StandardInstructionSetService;

import java.util.List;

@Slf4j
@RestController
@TbCoreComponent
@RequestMapping("/api/smarthome")
@RequiredArgsConstructor
public class SmartHomeProductController extends BaseController {

    private final ProductCategoryService productCategoryService;
    private final DataPointService dataPointService;
    private final StandardInstructionSetService standardInstructionSetService;

    // ========== Product Categories ==========

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @GetMapping(value = "/categories")
    public PageData<ProductCategory> getProductCategories(
            @Parameter(description = "Maximum amount of entities in a one page")
            @RequestParam int pageSize,
            @Parameter(description = "Sequence number of page starting from 0")
            @RequestParam int page,
            @RequestParam(required = false) String textSearch,
            @RequestParam(required = false) String sortProperty,
            @RequestParam(required = false) String sortOrder) throws ThingsboardException {
        PageLink pageLink = createPageLink(pageSize, page, textSearch, sortProperty, sortOrder);
        return checkNotNull(productCategoryService.findProductCategories(getTenantId(), pageLink));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @GetMapping(value = "/categories/{categoryId}")
    public ProductCategory getProductCategoryById(
            @PathVariable("categoryId") String strCategoryId) throws ThingsboardException {
        checkParameter("categoryId", strCategoryId);
        ProductCategoryId categoryId = new ProductCategoryId(toUUID(strCategoryId));
        ProductCategory category = checkNotNull(productCategoryService.findProductCategoryById(getTenantId(), categoryId));
        accessControlService.checkPermission(getCurrentUser(), Resource.PRODUCT_CATEGORY, Operation.READ, categoryId, category);
        return category;
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN')")
    @PostMapping(value = "/categories")
    public ProductCategory saveProductCategory(
            @RequestBody ProductCategory category) throws ThingsboardException {
        category.setTenantId(getTenantId());
        if (category.getId() != null) {
            accessControlService.checkPermission(getCurrentUser(), Resource.PRODUCT_CATEGORY, Operation.WRITE, category.getId(), category);
        }
        return checkNotNull(productCategoryService.saveProductCategory(category));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN')")
    @DeleteMapping(value = "/categories/{categoryId}")
    public void deleteProductCategory(
            @PathVariable("categoryId") String strCategoryId) throws ThingsboardException {
        checkParameter("categoryId", strCategoryId);
        ProductCategoryId categoryId = new ProductCategoryId(toUUID(strCategoryId));
        ProductCategory category = checkNotNull(productCategoryService.findProductCategoryById(getTenantId(), categoryId));
        accessControlService.checkPermission(getCurrentUser(), Resource.PRODUCT_CATEGORY, Operation.DELETE, categoryId, category);
        productCategoryService.deleteProductCategory(getTenantId(), categoryId);
    }

    // ========== Data Points ==========

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @GetMapping(value = "/products/{deviceProfileId}/datapoints")
    public List<DataPoint> getDataPoints(
            @PathVariable("deviceProfileId") String strDeviceProfileId) throws ThingsboardException {
        checkParameter("deviceProfileId", strDeviceProfileId);
        DeviceProfileId deviceProfileId = new DeviceProfileId(toUUID(strDeviceProfileId));
        checkNotNull(deviceProfileService.findDeviceProfileById(getTenantId(), deviceProfileId));
        return dataPointService.findDataPointsByDeviceProfileId(deviceProfileId);
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN', 'CUSTOMER_USER')")
    @GetMapping(value = "/products/{deviceProfileId}/datapoints/{dpId}")
    public DataPoint getDataPointByDpId(
            @PathVariable("deviceProfileId") String strDeviceProfileId,
            @PathVariable("dpId") int dpId) throws ThingsboardException {
        checkParameter("deviceProfileId", strDeviceProfileId);
        DeviceProfileId deviceProfileId = new DeviceProfileId(toUUID(strDeviceProfileId));
        checkNotNull(deviceProfileService.findDeviceProfileById(getTenantId(), deviceProfileId));
        return checkNotNull(dataPointService.findDataPointByDeviceProfileIdAndDpId(deviceProfileId, dpId));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN')")
    @PostMapping(value = "/products/{deviceProfileId}/datapoints")
    public DataPoint saveDataPoint(
            @PathVariable("deviceProfileId") String strDeviceProfileId,
            @RequestBody DataPoint dataPoint) throws ThingsboardException {
        checkParameter("deviceProfileId", strDeviceProfileId);
        DeviceProfileId deviceProfileId = new DeviceProfileId(toUUID(strDeviceProfileId));
        checkNotNull(deviceProfileService.findDeviceProfileById(getTenantId(), deviceProfileId));
        dataPoint.setTenantId(getTenantId());
        dataPoint.setDeviceProfileId(deviceProfileId);
        return checkNotNull(dataPointService.saveDataPoint(dataPoint));
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN')")
    @DeleteMapping(value = "/datapoints/{dataPointId}")
    public void deleteDataPoint(
            @PathVariable("dataPointId") String strDataPointId) throws ThingsboardException {
        checkParameter("dataPointId", strDataPointId);
        DataPointId dataPointId = new DataPointId(toUUID(strDataPointId));
        DataPoint dataPoint = checkNotNull(dataPointService.findDataPointById(getTenantId(), dataPointId));
        accessControlService.checkPermission(getCurrentUser(), Resource.DATA_POINT, Operation.DELETE, dataPointId, dataPoint);
        dataPointService.deleteDataPoint(getTenantId(), dataPointId);
    }

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN')")
    @PostMapping(value = "/products/{deviceProfileId}/apply-standard-dps")
    public List<DataPoint> applyStandardDps(
            @PathVariable("deviceProfileId") String strDeviceProfileId,
            @RequestBody List<DataPoint> standardDps) throws ThingsboardException {
        checkParameter("deviceProfileId", strDeviceProfileId);
        DeviceProfileId deviceProfileId = new DeviceProfileId(toUUID(strDeviceProfileId));
        checkNotNull(deviceProfileService.findDeviceProfileById(getTenantId(), deviceProfileId));
        return dataPointService.applyStandardDpSet(getTenantId(), deviceProfileId, standardDps);
    }

    // ========== Standard Instruction Sets ==========

    @PreAuthorize("hasAnyAuthority('TENANT_ADMIN')")
    @PostMapping(value = "/categories/seed-standard")
    public void seedStandardCategories() throws ThingsboardException {
        standardInstructionSetService.seedStandardCategories(getTenantId());
    }

}
