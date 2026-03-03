///
/// Copyright © 2016-2025 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import api from './client';
import { PageData, PageLink, pageLinkToQueryParams } from '@/models/page.model';

export interface AuditLog {
  id: { id: string; entityType: string };
  createdTime: number;
  tenantId: { id: string; entityType: string };
  entityId: { id: string; entityType: string };
  entityName: string;
  userId: { id: string; entityType: string };
  userName: string;
  actionType: string;
  actionData?: Record<string, unknown>;
  actionStatus: string;
  actionFailureDetails?: string;
}

export const auditLogApi = {
  getAuditLogs(pl: PageLink): Promise<PageData<AuditLog>> {
    return api.get('/api/audit/logs', { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getAuditLogsByEntityId(entityType: string, entityId: string, pl: PageLink): Promise<PageData<AuditLog>> {
    return api.get(`/api/audit/logs/entity/${entityType}/${entityId}`, { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getAuditLogsByUserId(userId: string, pl: PageLink): Promise<PageData<AuditLog>> {
    return api.get(`/api/audit/logs/user/${userId}`, { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getAuditLogsByCustomerId(customerId: string, pl: PageLink): Promise<PageData<AuditLog>> {
    return api.get(`/api/audit/logs/customer/${customerId}`, { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },
};
