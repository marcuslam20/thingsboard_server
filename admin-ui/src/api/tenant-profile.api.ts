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

export interface TenantProfile {
  id: { id: string; entityType: string };
  createdTime: number;
  name: string;
  description?: string;
  default: boolean;
  isolatedTbRuleEngine: boolean;
  profileData?: {
    configuration?: Record<string, unknown>;
  };
}

export interface TenantProfileInfo {
  id: { id: string; entityType: string };
  createdTime: number;
  name: string;
  description?: string;
  default: boolean;
  isolatedTbRuleEngine: boolean;
}

export const tenantProfileApi = {
  getTenantProfiles(pl: PageLink): Promise<PageData<TenantProfile>> {
    return api.get('/api/tenantProfiles', { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getTenantProfileInfos(pl: PageLink): Promise<PageData<TenantProfileInfo>> {
    return api.get('/api/tenantProfileInfos', { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getTenantProfile(tenantProfileId: string): Promise<TenantProfile> {
    return api.get(`/api/tenantProfile/${tenantProfileId}`).then((r) => r.data);
  },

  saveTenantProfile(profile: Partial<TenantProfile>): Promise<TenantProfile> {
    return api.post('/api/tenantProfile', profile).then((r) => r.data);
  },

  deleteTenantProfile(tenantProfileId: string): Promise<void> {
    return api.delete(`/api/tenantProfile/${tenantProfileId}`).then(() => undefined);
  },

  setDefaultTenantProfile(tenantProfileId: string): Promise<TenantProfile> {
    return api.post(`/api/tenantProfile/${tenantProfileId}/default`).then((r) => r.data);
  },
};
