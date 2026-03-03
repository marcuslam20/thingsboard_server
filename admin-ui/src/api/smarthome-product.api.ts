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
import { DataPoint, ProductCategory } from '@/models/datapoint.model';
import { PageData } from '@/models/page.model';

export const smartHomeProductApi = {
  getDataPoints(deviceProfileId: string): Promise<DataPoint[]> {
    return api.get(`/api/smarthome/products/${deviceProfileId}/datapoints`).then((r) => r.data);
  },

  getDataPoint(deviceProfileId: string, dpId: number): Promise<DataPoint> {
    return api.get(`/api/smarthome/products/${deviceProfileId}/datapoints/${dpId}`).then((r) => r.data);
  },

  saveDataPoint(deviceProfileId: string, dp: Partial<DataPoint>): Promise<DataPoint> {
    return api.post(`/api/smarthome/products/${deviceProfileId}/datapoints`, dp).then((r) => r.data);
  },

  deleteDataPoint(dataPointId: string): Promise<void> {
    return api.delete(`/api/smarthome/datapoints/${dataPointId}`).then(() => undefined);
  },

  applyStandardDps(deviceProfileId: string, dps: Partial<DataPoint>[]): Promise<DataPoint[]> {
    return api.post(`/api/smarthome/products/${deviceProfileId}/apply-standard-dps`, dps).then((r) => r.data);
  },

  getCategories(page = 0, pageSize = 100, textSearch?: string): Promise<PageData<ProductCategory>> {
    const params: Record<string, string> = { page: String(page), pageSize: String(pageSize) };
    if (textSearch) params.textSearch = textSearch;
    return api.get('/api/smarthome/categories', { params }).then((r) => r.data);
  },

  getCategory(categoryId: string): Promise<ProductCategory> {
    return api.get(`/api/smarthome/categories/${categoryId}`).then((r) => r.data);
  },

  seedStandardCategories(): Promise<void> {
    return api.post('/api/smarthome/categories/seed-standard').then(() => undefined);
  },
};
