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
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.common.data.smarthome.SmartHomeMember;
import org.thingsboard.server.common.data.smarthome.SmartHomeMemberRole;
import org.thingsboard.server.common.data.smarthome.SmartHomeMemberStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class SmartHomeMemberServiceImpl implements SmartHomeMemberService {

    private final SmartHomeMemberDao smartHomeMemberDao;

    @Override
    public SmartHomeMember addMember(SmartHomeMember member) {
        log.trace("Executing addMember [{}]", member);
        return smartHomeMemberDao.save(member);
    }

    @Override
    public Optional<SmartHomeMember> findMemberById(UUID memberId) {
        log.trace("Executing findMemberById [{}]", memberId);
        return smartHomeMemberDao.findById(memberId);
    }

    @Override
    public List<SmartHomeMember> findMembersBySmartHomeId(SmartHomeId smartHomeId) {
        log.trace("Executing findMembersBySmartHomeId [{}]", smartHomeId);
        return smartHomeMemberDao.findBySmartHomeId(smartHomeId.getId());
    }

    @Override
    public Optional<SmartHomeMember> findMember(SmartHomeId smartHomeId, UserId userId) {
        log.trace("Executing findMember [{}, {}]", smartHomeId, userId);
        return smartHomeMemberDao.findBySmartHomeIdAndUserId(smartHomeId.getId(), userId.getId());
    }

    @Override
    public List<SmartHomeMember> findMembersByUserId(UserId userId) {
        log.trace("Executing findMembersByUserId [{}]", userId);
        return smartHomeMemberDao.findByUserId(userId.getId());
    }

    @Override
    public List<SmartHomeMember> findActiveMembersByUserId(UserId userId) {
        log.trace("Executing findActiveMembersByUserId [{}]", userId);
        return smartHomeMemberDao.findByUserIdAndStatus(userId.getId(), SmartHomeMemberStatus.ACTIVE);
    }

    @Override
    public SmartHomeMember updateMember(SmartHomeMember member) {
        log.trace("Executing updateMember [{}]", member);
        return smartHomeMemberDao.save(member);
    }

    @Override
    public void removeMember(UUID memberId) {
        log.trace("Executing removeMember [{}]", memberId);
        smartHomeMemberDao.removeById(memberId);
    }

    @Override
    public void removeAllBySmartHomeId(SmartHomeId smartHomeId) {
        log.trace("Executing removeAllBySmartHomeId [{}]", smartHomeId);
        smartHomeMemberDao.removeBySmartHomeId(smartHomeId.getId());
    }

    @Override
    public boolean isMember(SmartHomeId smartHomeId, UserId userId) {
        return smartHomeMemberDao.findBySmartHomeIdAndUserId(smartHomeId.getId(), userId.getId())
                .filter(m -> m.getStatus() == SmartHomeMemberStatus.ACTIVE)
                .isPresent();
    }

    @Override
    public Optional<SmartHomeMemberRole> getMemberRole(SmartHomeId smartHomeId, UserId userId) {
        return smartHomeMemberDao.findBySmartHomeIdAndUserId(smartHomeId.getId(), userId.getId())
                .filter(m -> m.getStatus() == SmartHomeMemberStatus.ACTIVE)
                .map(SmartHomeMember::getRole);
    }
}
