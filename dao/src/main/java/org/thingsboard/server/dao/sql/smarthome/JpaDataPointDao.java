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
package org.thingsboard.server.dao.sql.smarthome;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.thingsboard.server.common.data.EntityType;
import org.thingsboard.server.common.data.smarthome.DataPoint;
import org.thingsboard.server.dao.DaoUtil;
import org.thingsboard.server.dao.model.sql.DataPointEntity;
import org.thingsboard.server.dao.smarthome.DataPointDao;
import org.thingsboard.server.dao.sql.JpaAbstractDao;
import org.thingsboard.server.dao.util.SqlDao;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@SqlDao
public class JpaDataPointDao extends JpaAbstractDao<DataPointEntity, DataPoint> implements DataPointDao {

    @Autowired
    private DataPointRepository repository;

    @Override
    protected Class<DataPointEntity> getEntityClass() {
        return DataPointEntity.class;
    }

    @Override
    protected JpaRepository<DataPointEntity, UUID> getRepository() {
        return repository;
    }

    @Override
    public List<DataPoint> findByDeviceProfileId(UUID deviceProfileId) {
        return DaoUtil.convertDataList(repository.findByDeviceProfileIdOrderBySortOrder(deviceProfileId));
    }

    @Override
    public Optional<DataPoint> findByDeviceProfileIdAndDpId(UUID deviceProfileId, int dpId) {
        return repository.findByDeviceProfileIdAndDpId(deviceProfileId, dpId).map(DaoUtil::getData);
    }

    @Override
    public Optional<DataPoint> findByDeviceProfileIdAndCode(UUID deviceProfileId, String code) {
        return repository.findByDeviceProfileIdAndCode(deviceProfileId, code).map(DaoUtil::getData);
    }

    @Override
    @Transactional
    public void removeByDeviceProfileId(UUID deviceProfileId) {
        repository.deleteByDeviceProfileId(deviceProfileId);
    }

    @Override
    public EntityType getEntityType() {
        return EntityType.DATA_POINT;
    }

}
