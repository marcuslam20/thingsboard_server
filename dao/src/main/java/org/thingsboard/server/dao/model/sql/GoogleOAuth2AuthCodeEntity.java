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
@Table(name = "google_oauth2_auth_codes")
public class GoogleOAuth2AuthCodeEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @Column(name = "code", length = 255)
    private String code;

    @Column(name = "tenant_id", columnDefinition = "uuid", nullable = false)
    private UUID tenantId;

    @Column(name = "user_id", columnDefinition = "uuid", nullable = false)
    private UUID userId;

    @Column(name = "google_user_id", nullable = false, length = 255)
    private String googleUserId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Timestamp createdAt;

    @Column(name = "expires_at", nullable = false)
    private Timestamp expiresAt;

    @Column(name = "used", nullable = false)
    private Boolean used;

    public GoogleOAuth2AuthCodeEntity() {
        super();
    }

    public GoogleOAuth2AuthCodeEntity(String code, UUID tenantId, UUID userId, String googleUserId,
                                       Timestamp createdAt, Timestamp expiresAt, Boolean used) {
        this.code = code;
        this.tenantId = tenantId;
        this.userId = userId;
        this.googleUserId = googleUserId;
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
