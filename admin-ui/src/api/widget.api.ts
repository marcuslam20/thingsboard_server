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

export interface WidgetsBundle {
  id?: { id: string; entityType: string };
  createdTime?: number;
  tenantId?: { id: string; entityType: string };
  alias?: string;
  title: string;
  image?: string | null;
  description?: string;
  order?: number;
  scada?: boolean;
}

export interface WidgetTypeInfo {
  id?: { id: string; entityType: string };
  createdTime?: number;
  tenantId?: { id: string; entityType: string };
  fqn?: string;
  name: string;
  image?: string | null;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
  scada?: boolean;
  widgetType?: string;
}

export const widgetApi = {
  getWidgetsBundles(pl: PageLink): Promise<PageData<WidgetsBundle>> {
    return api.get('/api/widgetsBundles', { params: { ...pageLinkToQueryParams(pl) } }).then((r) => r.data);
  },

  getAllWidgetsBundles(): Promise<WidgetsBundle[]> {
    return api.get('/api/widgetsBundles', { params: { pageSize: 1024, page: 0, sortProperty: 'title', sortOrder: 'ASC' } }).then((r) => r.data.data || r.data);
  },

  getWidgetsBundle(bundleId: string): Promise<WidgetsBundle> {
    return api.get(`/api/widgetsBundle/${bundleId}`).then((r) => r.data);
  },

  saveWidgetsBundle(bundle: Partial<WidgetsBundle>): Promise<WidgetsBundle> {
    return api.post('/api/widgetsBundle', bundle).then((r) => r.data);
  },

  deleteWidgetsBundle(bundleId: string): Promise<void> {
    return api.delete(`/api/widgetsBundle/${bundleId}`).then(() => undefined);
  },

  getBundleWidgetTypes(bundleId: string, pl: PageLink): Promise<PageData<WidgetTypeInfo>> {
    return api.get('/api/widgetTypesInfos', { params: { widgetsBundleId: bundleId, ...pageLinkToQueryParams(pl) } }).then((r) => r.data);
  },

  getWidgetType(widgetTypeId: string): Promise<WidgetTypeInfo> {
    return api.get(`/api/widgetType/${widgetTypeId}`).then((r) => r.data);
  },

  saveWidgetType(widgetType: Partial<WidgetTypeInfo>): Promise<WidgetTypeInfo> {
    return api.post('/api/widgetType', widgetType).then((r) => r.data);
  },

  deleteWidgetType(widgetTypeId: string): Promise<void> {
    return api.delete(`/api/widgetType/${widgetTypeId}`).then(() => undefined);
  },
};
