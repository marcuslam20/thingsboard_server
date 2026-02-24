import api from './client';
import { DeviceProfile } from '@/models/device.model';
import { PageData, PageLink, pageLinkToQueryParams } from '@/models/page.model';

export interface DeviceProfileInfo {
  id: { id: string; entityType: string };
  createdTime: number;
  tenantId: { id: string; entityType: string };
  name: string;
  type: string;
  transportType: string;
  image?: string;
  defaultDashboardId?: { id: string; entityType: string };
  default: boolean;
}

export const deviceProfileApi = {
  getDeviceProfiles(pl: PageLink): Promise<PageData<DeviceProfile>> {
    return api.get('/api/deviceProfiles', { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getDeviceProfileInfos(pl: PageLink): Promise<PageData<DeviceProfileInfo>> {
    return api.get('/api/deviceProfileInfos', { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getDeviceProfile(deviceProfileId: string): Promise<DeviceProfile> {
    return api.get(`/api/deviceProfile/${deviceProfileId}`).then((r) => r.data);
  },

  saveDeviceProfile(profile: Partial<DeviceProfile>): Promise<DeviceProfile> {
    return api.post('/api/deviceProfile', profile).then((r) => r.data);
  },

  deleteDeviceProfile(deviceProfileId: string): Promise<void> {
    return api.delete(`/api/deviceProfile/${deviceProfileId}`).then(() => undefined);
  },

  getDefaultDeviceProfileInfo(): Promise<DeviceProfileInfo> {
    return api.get('/api/deviceProfileInfo/default').then((r) => r.data);
  },

  setDefaultDeviceProfile(deviceProfileId: string): Promise<DeviceProfile> {
    return api.post(`/api/deviceProfile/${deviceProfileId}/default`).then((r) => r.data);
  },
};
