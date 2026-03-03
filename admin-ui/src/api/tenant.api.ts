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

export interface TenantInfo {
  id: { id: string; entityType: string };
  createdTime: number;
  name: string;
  title: string;
  tenantProfileName?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  address2?: string;
  zip?: string;
  phone?: string;
  email?: string;
  additionalInfo?: Record<string, unknown>;
}

export const tenantApi = {
  getTenants(pl: PageLink): Promise<PageData<TenantInfo>> {
    return api.get('/api/tenantInfos', { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getTenant(tenantId: string): Promise<TenantInfo> {
    return api.get(`/api/tenant/${tenantId}`).then((r) => r.data);
  },

  saveTenant(tenant: Partial<TenantInfo>): Promise<TenantInfo> {
    return api.post('/api/tenant', tenant).then((r) => r.data);
  },

  deleteTenant(tenantId: string): Promise<void> {
    return api.delete(`/api/tenant/${tenantId}`).then(() => undefined);
  },

  getTenantUsers(tenantId: string, pl: PageLink): Promise<PageData<unknown>> {
    return api.get(`/api/tenant/${tenantId}/users`, { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },
};
