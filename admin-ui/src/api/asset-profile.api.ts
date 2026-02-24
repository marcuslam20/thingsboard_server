import api from './client';
import { PageData, PageLink, pageLinkToQueryParams } from '@/models/page.model';

export interface AssetProfile {
  id: { id: string; entityType: string };
  createdTime: number;
  tenantId: { id: string; entityType: string };
  name: string;
  description?: string;
  image?: string;
  default: boolean;
  defaultRuleChainId?: { id: string; entityType: string };
  defaultDashboardId?: { id: string; entityType: string };
  defaultQueueName?: string;
  defaultEdgeRuleChainId?: { id: string; entityType: string };
}

export interface AssetProfileInfo {
  id: { id: string; entityType: string };
  createdTime: number;
  tenantId: { id: string; entityType: string };
  name: string;
  image?: string;
  default: boolean;
}

export const assetProfileApi = {
  getAssetProfiles(pl: PageLink): Promise<PageData<AssetProfile>> {
    return api.get('/api/assetProfiles', { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getAssetProfileInfos(pl: PageLink): Promise<PageData<AssetProfileInfo>> {
    return api.get('/api/assetProfileInfos', { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getAssetProfile(assetProfileId: string): Promise<AssetProfile> {
    return api.get(`/api/assetProfile/${assetProfileId}`).then((r) => r.data);
  },

  saveAssetProfile(profile: Partial<AssetProfile>): Promise<AssetProfile> {
    return api.post('/api/assetProfile', profile).then((r) => r.data);
  },

  deleteAssetProfile(assetProfileId: string): Promise<void> {
    return api.delete(`/api/assetProfile/${assetProfileId}`).then(() => undefined);
  },

  getDefaultAssetProfileInfo(): Promise<AssetProfileInfo> {
    return api.get('/api/assetProfileInfo/default').then((r) => r.data);
  },

  setDefaultAssetProfile(assetProfileId: string): Promise<AssetProfile> {
    return api.post(`/api/assetProfile/${assetProfileId}/default`).then((r) => r.data);
  },
};
