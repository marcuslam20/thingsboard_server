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
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.page.PageData;
import org.thingsboard.server.common.data.page.PageLink;
import org.thingsboard.server.common.data.smarthome.Room;
import org.thingsboard.server.dao.DaoUtil;
import org.thingsboard.server.dao.model.sql.RoomEntity;
import org.thingsboard.server.dao.smarthome.RoomDao;
import org.thingsboard.server.dao.sql.JpaAbstractDao;
import org.thingsboard.server.dao.util.SqlDao;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@SqlDao
public class JpaRoomDao extends JpaAbstractDao<RoomEntity, Room> implements RoomDao {

    @Autowired
    private RoomRepository repository;

    @Override
    protected Class<RoomEntity> getEntityClass() {
        return RoomEntity.class;
    }

    @Override
    protected JpaRepository<RoomEntity, UUID> getRepository() {
        return repository;
    }

    @Override
    public Long countByTenantId(TenantId tenantId) {
        return repository.countByTenantId(tenantId.getId());
    }

    @Override
    public List<Room> findBySmartHomeId(UUID smartHomeId) {
        return repository.findBySmartHomeIdOrderBySortOrder(smartHomeId).stream()
                .map(DaoUtil::getData)
                .collect(Collectors.toList());
    }

    @Override
    public PageData<Room> findByTenantId(UUID tenantId, PageLink pageLink) {
        return DaoUtil.toPageData(repository.findByTenantId(tenantId, DaoUtil.toPageable(pageLink)));
    }

    @Override
    public PageData<Room> findAllByTenantId(TenantId tenantId, PageLink pageLink) {
        return findByTenantId(tenantId.getId(), pageLink);
    }

    @Override
    @Transactional
    public void removeBySmartHomeId(UUID smartHomeId) {
        repository.deleteBySmartHomeId(smartHomeId);
    }

    @Override
    public EntityType getEntityType() {
        return EntityType.ROOM;
    }
}
