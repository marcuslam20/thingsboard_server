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

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.thingsboard.server.common.data.smarthome.SmartHomeMember;
import org.thingsboard.server.common.data.smarthome.SmartHomeMemberStatus;
import org.thingsboard.server.dao.model.sql.SmartHomeMemberEntity;
import org.thingsboard.server.dao.smarthome.SmartHomeMemberDao;
import org.thingsboard.server.dao.util.SqlDao;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@SqlDao
@RequiredArgsConstructor
public class JpaSmartHomeMemberDao implements SmartHomeMemberDao {

    private final SmartHomeMemberRepository repository;

    @Override
    public SmartHomeMember save(SmartHomeMember member) {
        SmartHomeMemberEntity entity = new SmartHomeMemberEntity(member);
        if (entity.getId() == null) {
            entity.setId(UUID.randomUUID());
            entity.setCreatedTime(System.currentTimeMillis());
        }
        return repository.save(entity).toData();
    }

    @Override
    public Optional<SmartHomeMember> findById(UUID id) {
        return repository.findById(id).map(SmartHomeMemberEntity::toData);
    }

    @Override
    public List<SmartHomeMember> findBySmartHomeId(UUID smartHomeId) {
        return repository.findBySmartHomeId(smartHomeId).stream()
                .map(SmartHomeMemberEntity::toData)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<SmartHomeMember> findBySmartHomeIdAndUserId(UUID smartHomeId, UUID userId) {
        return repository.findBySmartHomeIdAndUserId(smartHomeId, userId)
                .map(SmartHomeMemberEntity::toData);
    }

    @Override
    public List<SmartHomeMember> findByUserId(UUID userId) {
        return repository.findByUserId(userId).stream()
                .map(SmartHomeMemberEntity::toData)
                .collect(Collectors.toList());
    }

    @Override
    public List<SmartHomeMember> findByUserIdAndStatus(UUID userId, SmartHomeMemberStatus status) {
        return repository.findByUserIdAndStatus(userId, status).stream()
                .map(SmartHomeMemberEntity::toData)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void removeById(UUID id) {
        repository.deleteById(id);
    }

    @Override
    @Transactional
    public void removeBySmartHomeId(UUID smartHomeId) {
        repository.deleteBySmartHomeId(smartHomeId);
    }
}
