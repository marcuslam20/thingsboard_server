import api from './client';
import { PageData, PageLink, pageLinkToQueryParams } from '@/models/page.model';

export interface Asset {
  id: { id: string; entityType: string };
  createdTime: number;
  tenantId: { id: string; entityType: string };
  customerId?: { id: string; entityType: string };
  name: string;
  type: string;
  label?: string;
  assetProfileId: { id: string; entityType: string };
  additionalInfo?: Record<string, unknown>;
}

export interface AssetInfo extends Asset {
  customerTitle?: string;
  customerIsPublic?: boolean;
  assetProfileName?: string;
}

export const assetApi = {
  getTenantAssetInfos(pl: PageLink, type?: string): Promise<PageData<AssetInfo>> {
    const params: Record<string, string> = pageLinkToQueryParams(pl);
    if (type) params.type = type;
    return api.get('/api/tenant/assetInfos', { params }).then((r) => r.data);
  },

  getAsset(assetId: string): Promise<Asset> {
    return api.get(`/api/asset/${assetId}`).then((r) => r.data);
  },

  getAssetInfo(assetId: string): Promise<AssetInfo> {
    return api.get(`/api/asset/info/${assetId}`).then((r) => r.data);
  },

  saveAsset(asset: Partial<Asset>): Promise<Asset> {
    return api.post('/api/asset', asset).then((r) => r.data);
  },

  deleteAsset(assetId: string): Promise<void> {
    return api.delete(`/api/asset/${assetId}`).then(() => undefined);
  },

  getAssetTypes(): Promise<Array<{ tenantId: { id: string }; entityType: string; type: string }>> {
    return api.get('/api/asset/types').then((r) => r.data);
  },

  assignAssetToCustomer(customerId: string, assetId: string): Promise<Asset> {
    return api.post(`/api/customer/${customerId}/asset/${assetId}`).then((r) => r.data);
  },

  unassignAssetFromCustomer(assetId: string): Promise<void> {
    return api.delete(`/api/customer/asset/${assetId}`).then(() => undefined);
  },
};
