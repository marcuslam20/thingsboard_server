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

export interface EntityView {
  id: { id: string; entityType: string };
  createdTime: number;
  tenantId: { id: string; entityType: string };
  customerId?: { id: string; entityType: string };
  entityId: { id: string; entityType: string };
  name: string;
  type: string;
  keys?: {
    attributes?: { cs?: string[]; sh?: string[]; ss?: string[] };
    timeseries?: string[];
  };
  startTimeMs?: number;
  endTimeMs?: number;
  additionalInfo?: Record<string, unknown>;
}

export interface EntityViewInfo extends EntityView {
  customerTitle?: string;
  customerIsPublic?: boolean;
}

export const entityViewApi = {
  getTenantEntityViewInfos(pl: PageLink, type?: string): Promise<PageData<EntityViewInfo>> {
    const params: Record<string, string> = pageLinkToQueryParams(pl);
    if (type) params.type = type;
    return api.get('/api/tenant/entityViewInfos', { params }).then((r) => r.data);
  },

  getEntityView(entityViewId: string): Promise<EntityView> {
    return api.get(`/api/entityView/${entityViewId}`).then((r) => r.data);
  },

  getEntityViewInfo(entityViewId: string): Promise<EntityViewInfo> {
    return api.get(`/api/entityView/info/${entityViewId}`).then((r) => r.data);
  },

  saveEntityView(entityView: Partial<EntityView>): Promise<EntityView> {
    return api.post('/api/entityView', entityView).then((r) => r.data);
  },

  deleteEntityView(entityViewId: string): Promise<void> {
    return api.delete(`/api/entityView/${entityViewId}`).then(() => undefined);
  },

  getEntityViewTypes(): Promise<Array<{ tenantId: { id: string }; entityType: string; type: string }>> {
    return api.get('/api/entityView/types').then((r) => r.data);
  },

  assignEntityViewToCustomer(customerId: string, entityViewId: string): Promise<EntityView> {
    return api.post(`/api/customer/${customerId}/entityView/${entityViewId}`).then((r) => r.data);
  },

  unassignEntityViewFromCustomer(entityViewId: string): Promise<void> {
    return api.delete(`/api/customer/entityView/${entityViewId}`).then(() => undefined);
  },
};
