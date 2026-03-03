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
