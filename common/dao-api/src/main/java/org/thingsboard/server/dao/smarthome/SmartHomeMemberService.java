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

import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.common.data.smarthome.SmartHomeMember;
import org.thingsboard.server.common.data.smarthome.SmartHomeMemberRole;
import org.thingsboard.server.common.data.smarthome.SmartHomeMemberStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SmartHomeMemberService {

    SmartHomeMember addMember(SmartHomeMember member);

    Optional<SmartHomeMember> findMemberById(UUID memberId);

    List<SmartHomeMember> findMembersBySmartHomeId(SmartHomeId smartHomeId);

    Optional<SmartHomeMember> findMember(SmartHomeId smartHomeId, UserId userId);

    List<SmartHomeMember> findMembersByUserId(UserId userId);

    List<SmartHomeMember> findActiveMembersByUserId(UserId userId);

    SmartHomeMember updateMember(SmartHomeMember member);

    void removeMember(UUID memberId);

    void removeAllBySmartHomeId(SmartHomeId smartHomeId);

    boolean isMember(SmartHomeId smartHomeId, UserId userId);

    Optional<SmartHomeMemberRole> getMemberRole(SmartHomeId smartHomeId, UserId userId);
}
