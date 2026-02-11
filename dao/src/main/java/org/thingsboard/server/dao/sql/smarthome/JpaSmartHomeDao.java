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
import org.thingsboard.server.common.data.EntityType;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.page.PageData;
import org.thingsboard.server.common.data.page.PageLink;
import org.thingsboard.server.common.data.smarthome.SmartHome;
import org.thingsboard.server.dao.DaoUtil;
import org.thingsboard.server.dao.model.sql.SmartHomeEntity;
import org.thingsboard.server.dao.smarthome.SmartHomeDao;
import org.thingsboard.server.dao.sql.JpaAbstractDao;
import org.thingsboard.server.dao.util.SqlDao;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@SqlDao
public class JpaSmartHomeDao extends JpaAbstractDao<SmartHomeEntity, SmartHome> implements SmartHomeDao {

    @Autowired
    private SmartHomeRepository repository;

    @Override
    protected Class<SmartHomeEntity> getEntityClass() {
        return SmartHomeEntity.class;
    }

    @Override
    protected JpaRepository<SmartHomeEntity, UUID> getRepository() {
        return repository;
    }

    @Override
    public Long countByTenantId(TenantId tenantId) {
        return repository.countByTenantId(tenantId.getId());
    }

    @Override
    public PageData<SmartHome> findByTenantId(UUID tenantId, PageLink pageLink) {
        return DaoUtil.toPageData(repository.findByTenantId(tenantId, DaoUtil.toPageable(pageLink)));
    }

    @Override
    public PageData<SmartHome> findAllByTenantId(TenantId tenantId, PageLink pageLink) {
        return findByTenantId(tenantId.getId(), pageLink);
    }

    @Override
    public List<SmartHome> findByOwnerUserId(UUID ownerUserId) {
        return repository.findByOwnerUserId(ownerUserId).stream()
                .map(DaoUtil::getData)
                .collect(Collectors.toList());
    }

    @Override
    public EntityType getEntityType() {
        return EntityType.SMART_HOME;
    }
}
