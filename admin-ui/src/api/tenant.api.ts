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
