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
