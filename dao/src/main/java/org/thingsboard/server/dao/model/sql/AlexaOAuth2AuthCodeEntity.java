/**
 * Copyright © 2016-2024 The Thingsboard Authors
 * Copyright © 2024 PachiraMining
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
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import org.thingsboard.server.common.data.id.TenantId;
import org.thingsboard.server.common.data.id.UserId;

import java.io.Serializable;
import java.sql.Timestamp;
import java.util.UUID;

@Data
@Entity
@Table(name = "alexa_oauth2_auth_codes")
public class AlexaOAuth2AuthCodeEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @Column(name = "code", length = 255)
    private String code;

    @Column(name = "tenant_id", columnDefinition = "uuid", nullable = false)
    private UUID tenantId;

    @Column(name = "user_id", columnDefinition = "uuid", nullable = false)
    private UUID userId;

    @Column(name = "alexa_user_id", nullable = false, length = 255)
    private String alexaUserId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Timestamp createdAt;

    @Column(name = "expires_at", nullable = false)
    private Timestamp expiresAt;

    @Column(name = "used", nullable = false)
    private Boolean used;

    public AlexaOAuth2AuthCodeEntity() {
        super();
    }

    public AlexaOAuth2AuthCodeEntity(String code, UUID tenantId, UUID userId, String alexaUserId,
                                      Timestamp createdAt, Timestamp expiresAt, Boolean used) {
        this.code = code;
        this.tenantId = tenantId;
        this.userId = userId;
        this.alexaUserId = alexaUserId;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.used = used;
    }

    public TenantId toTenantId() {
        return new TenantId(tenantId);
    }

    public UserId toUserId() {
        return new UserId(userId);
    }
}
