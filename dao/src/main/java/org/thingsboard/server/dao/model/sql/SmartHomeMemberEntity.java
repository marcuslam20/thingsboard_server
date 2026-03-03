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
package org.thingsboard.server.dao.model.sql;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Data;
import org.thingsboard.server.common.data.id.SmartHomeId;
import org.thingsboard.server.common.data.id.UserId;
import org.thingsboard.server.common.data.smarthome.SmartHomeMember;
import org.thingsboard.server.common.data.smarthome.SmartHomeMemberRole;
import org.thingsboard.server.common.data.smarthome.SmartHomeMemberStatus;
import org.thingsboard.server.dao.model.ModelConstants;

import java.util.UUID;

@Data
@Entity
@Table(name = ModelConstants.SMART_HOME_MEMBER_TABLE_NAME)
public class SmartHomeMemberEntity {

    @Id
    @Column(name = ModelConstants.ID_PROPERTY, columnDefinition = "uuid")
    private UUID id;

    @Column(name = ModelConstants.CREATED_TIME_PROPERTY, updatable = false)
    private long createdTime;

    @Column(name = ModelConstants.SMART_HOME_MEMBER_SMART_HOME_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID smartHomeId;

    @Column(name = ModelConstants.SMART_HOME_MEMBER_USER_ID_PROPERTY, nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = ModelConstants.SMART_HOME_MEMBER_ROLE_PROPERTY, nullable = false)
    private SmartHomeMemberRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = ModelConstants.SMART_HOME_MEMBER_STATUS_PROPERTY, nullable = false)
    private SmartHomeMemberStatus status;

    @Column(name = ModelConstants.SMART_HOME_MEMBER_INVITED_BY_PROPERTY, columnDefinition = "uuid")
    private UUID invitedBy;

    @Version
    @Column(name = ModelConstants.VERSION_PROPERTY)
    private Long version;

    public SmartHomeMemberEntity() {}

    public SmartHomeMemberEntity(SmartHomeMember member) {
        this.id = member.getId();
        this.createdTime = member.getCreatedTime();
        this.smartHomeId = member.getSmartHomeId() != null ? member.getSmartHomeId().getId() : null;
        this.userId = member.getUserId() != null ? member.getUserId().getId() : null;
        this.role = member.getRole();
        this.status = member.getStatus();
        this.invitedBy = member.getInvitedBy() != null ? member.getInvitedBy().getId() : null;
        this.version = member.getVersion();
    }

    public SmartHomeMember toData() {
        SmartHomeMember member = new SmartHomeMember();
        member.setId(id);
        member.setCreatedTime(createdTime);
        member.setSmartHomeId(new SmartHomeId(smartHomeId));
        member.setUserId(new UserId(userId));
        member.setRole(role);
        member.setStatus(status);
        member.setInvitedBy(invitedBy != null ? new UserId(invitedBy) : null);
        member.setVersion(version);
        return member;
    }
}
