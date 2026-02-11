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
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.common.data.page.PageData;
import org.thingsboard.server.common.data.page.PageLink;
import org.thingsboard.server.common.data.smarthome.SmartHome;
import org.thingsboard.server.common.data.smarthome.SmartHomeMember;
import org.thingsboard.server.common.data.smarthome.SmartHomeMemberRole;
import org.thingsboard.server.common.data.smarthome.SmartHomeMemberStatus;
import org.thingsboard.server.dao.entity.AbstractEntityService;
import org.thingsboard.server.dao.service.Validator;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.thingsboard.server.dao.service.Validator.validateId;

@Service("SmartHomeDaoService")
@Slf4j
@RequiredArgsConstructor
public class SmartHomeServiceImpl extends AbstractEntityService implements SmartHomeService {

    private static final String INCORRECT_SMART_HOME_ID = "Incorrect smartHomeId ";
    private static final String INCORRECT_TENANT_ID = "Incorrect tenantId ";

    private final SmartHomeDao smartHomeDao;
    private final SmartHomeMemberDao smartHomeMemberDao;

    @Override
    public SmartHome findSmartHomeById(TenantId tenantId, SmartHomeId smartHomeId) {
        log.trace("Executing findSmartHomeById [{}]", smartHomeId);
        validateId(smartHomeId, id -> INCORRECT_SMART_HOME_ID + id);
        return smartHomeDao.findById(tenantId, smartHomeId.getId());
    }

    @Override
    @Transactional
    public SmartHome saveSmartHome(SmartHome smartHome) {
        log.trace("Executing saveSmartHome [{}]", smartHome);
        boolean isNew = smartHome.getId() == null;
        SmartHome savedHome = smartHomeDao.save(smartHome.getTenantId(), smartHome);

        if (isNew) {
            SmartHomeMember ownerMember = new SmartHomeMember();
            ownerMember.setSmartHomeId(savedHome.getId());
            ownerMember.setUserId(savedHome.getOwnerUserId());
            ownerMember.setRole(SmartHomeMemberRole.OWNER);
            ownerMember.setStatus(SmartHomeMemberStatus.ACTIVE);
            smartHomeMemberDao.save(ownerMember);
        }

        return savedHome;
    }

    @Override
    public PageData<SmartHome> findSmartHomesByTenantId(TenantId tenantId, PageLink pageLink) {
        log.trace("Executing findSmartHomesByTenantId, tenantId [{}], pageLink [{}]", tenantId, pageLink);
        validateId(tenantId, id -> INCORRECT_TENANT_ID + id);
        Validator.validatePageLink(pageLink);
        return smartHomeDao.findByTenantId(tenantId.getId(), pageLink);
    }

    @Override
    public List<SmartHome> findSmartHomesByUserId(UserId userId) {
        log.trace("Executing findSmartHomesByUserId [{}]", userId);
        validateId(userId, id -> "Incorrect userId " + id);
        List<SmartHomeMember> memberships = smartHomeMemberDao.findByUserIdAndStatus(
                userId.getId(), SmartHomeMemberStatus.ACTIVE);
        return memberships.stream()
                .map(m -> smartHomeDao.findById(TenantId.SYS_TENANT_ID, m.getSmartHomeId().getId()))
                .filter(h -> h != null)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteSmartHome(TenantId tenantId, SmartHomeId smartHomeId) {
        log.trace("Executing deleteSmartHome [{}]", smartHomeId);
        validateId(smartHomeId, id -> INCORRECT_SMART_HOME_ID + id);
        smartHomeDao.removeById(tenantId, smartHomeId.getId());
    }

    @Override
    public Optional<HasId<?>> findEntity(TenantId tenantId, EntityId entityId) {
        return Optional.ofNullable(findSmartHomeById(tenantId, new SmartHomeId(entityId.getId())));
    }

    @Override
    public EntityType getEntityType() {
        return EntityType.SMART_HOME;
    }
}
