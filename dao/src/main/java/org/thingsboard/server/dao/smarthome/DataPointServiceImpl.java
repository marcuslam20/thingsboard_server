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
import org.thingsboard.server.common.data.id.DataPointId;
import org.thingsboard.server.common.data.id.DeviceProfileId;
import org.thingsboard.server.common.data.id.EntityId;
import org.thingsboard.server.common.data.id.HasId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.smarthome.DataPoint;
import org.thingsboard.server.dao.entity.AbstractEntityService;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.thingsboard.server.dao.service.Validator.validateId;

@Service("DataPointDaoService")
@Slf4j
@RequiredArgsConstructor
public class DataPointServiceImpl extends AbstractEntityService implements DataPointService {

    private static final String INCORRECT_DATA_POINT_ID = "Incorrect dataPointId ";

    private final DataPointDao dataPointDao;

    @Override
    public DataPoint findDataPointById(TenantId tenantId, DataPointId dataPointId) {
        log.trace("Executing findDataPointById [{}]", dataPointId);
        validateId(dataPointId, id -> INCORRECT_DATA_POINT_ID + id);
        return dataPointDao.findById(tenantId, dataPointId.getId());
    }

    @Override
    public List<DataPoint> findDataPointsByDeviceProfileId(DeviceProfileId deviceProfileId) {
        log.trace("Executing findDataPointsByDeviceProfileId [{}]", deviceProfileId);
        return dataPointDao.findByDeviceProfileId(deviceProfileId.getId());
    }

    @Override
    public DataPoint findDataPointByDeviceProfileIdAndDpId(DeviceProfileId deviceProfileId, int dpId) {
        log.trace("Executing findDataPointByDeviceProfileIdAndDpId [{}, {}]", deviceProfileId, dpId);
        return dataPointDao.findByDeviceProfileIdAndDpId(deviceProfileId.getId(), dpId).orElse(null);
    }

    @Override
    public DataPoint findDataPointByDeviceProfileIdAndCode(DeviceProfileId deviceProfileId, String code) {
        log.trace("Executing findDataPointByDeviceProfileIdAndCode [{}, {}]", deviceProfileId, code);
        return dataPointDao.findByDeviceProfileIdAndCode(deviceProfileId.getId(), code).orElse(null);
    }

    @Override
    public DataPoint saveDataPoint(DataPoint dataPoint) {
        log.trace("Executing saveDataPoint [{}]", dataPoint);
        return dataPointDao.save(dataPoint.getTenantId(), dataPoint);
    }

    @Override
    @Transactional
    public void deleteDataPoint(TenantId tenantId, DataPointId dataPointId) {
        log.trace("Executing deleteDataPoint [{}]", dataPointId);
        validateId(dataPointId, id -> INCORRECT_DATA_POINT_ID + id);
        dataPointDao.removeById(tenantId, dataPointId.getId());
    }

    @Override
    @Transactional
    public void deleteDataPointsByDeviceProfileId(DeviceProfileId deviceProfileId) {
        log.trace("Executing deleteDataPointsByDeviceProfileId [{}]", deviceProfileId);
        dataPointDao.removeByDeviceProfileId(deviceProfileId.getId());
    }

    @Override
    @Transactional
    public List<DataPoint> applyStandardDpSet(TenantId tenantId, DeviceProfileId deviceProfileId, List<DataPoint> standardDps) {
        log.trace("Executing applyStandardDpSet for deviceProfile [{}], dpCount [{}]", deviceProfileId, standardDps.size());
        List<DataPoint> saved = new ArrayList<>();
        for (DataPoint dp : standardDps) {
            dp.setTenantId(tenantId);
            dp.setDeviceProfileId(deviceProfileId);
            dp.setStandard(true);
            saved.add(dataPointDao.save(tenantId, dp));
        }
        return saved;
    }

    @Override
    public Optional<HasId<?>> findEntity(TenantId tenantId, EntityId entityId) {
        return Optional.ofNullable(findDataPointById(tenantId, new DataPointId(entityId.getId())));
    }

    @Override
    public EntityType getEntityType() {
        return EntityType.DATA_POINT;
    }

}
