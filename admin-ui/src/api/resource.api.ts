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

export interface TbResourceInfo {
  id: { id: string; entityType: string };
  createdTime: number;
  tenantId: { id: string; entityType: string };
  title: string;
  resourceType: string;
  resourceKey?: string;
  fileName?: string;
  isPublic?: boolean;
}

export interface TbResource extends TbResourceInfo {
  data?: string;
}

export const resourceApi = {
  getResources(pl: PageLink): Promise<PageData<TbResourceInfo>> {
    return api.get('/api/resource', { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getResource(resourceId: string): Promise<TbResource> {
    return api.get(`/api/resource/${resourceId}`).then((r) => r.data);
  },

  getResourceInfo(resourceId: string): Promise<TbResourceInfo> {
    return api.get(`/api/resource/info/${resourceId}`).then((r) => r.data);
  },

  saveResource(resource: Partial<TbResource>): Promise<TbResource> {
    return api.post('/api/resource', resource).then((r) => r.data);
  },

  deleteResource(resourceId: string): Promise<void> {
    return api.delete(`/api/resource/${resourceId}`).then(() => undefined);
  },

  downloadResource(resourceId: string): Promise<Blob> {
    return api.get(`/api/resource/${resourceId}/download`, { responseType: 'blob' }).then((r) => r.data);
  },
};
