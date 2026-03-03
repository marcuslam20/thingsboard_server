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
import { Dashboard, DashboardInfo } from '@/models/dashboard.model';
import { PageData, PageLink, pageLinkToQueryParams } from '@/models/page.model';

export const dashboardApi = {
  getTenantDashboards(pl: PageLink): Promise<PageData<DashboardInfo>> {
    const params = pageLinkToQueryParams(pl);
    return api.get('/api/tenant/dashboards', { params }).then((r) => r.data);
  },

  getDashboard(dashboardId: string): Promise<Dashboard> {
    return api.get(`/api/dashboard/${dashboardId}`).then((r) => r.data);
  },

  getDashboardInfo(dashboardId: string): Promise<DashboardInfo> {
    return api.get(`/api/dashboard/info/${dashboardId}`).then((r) => r.data);
  },

  saveDashboard(dashboard: Partial<Dashboard>): Promise<Dashboard> {
    return api.post('/api/dashboard', dashboard).then((r) => r.data);
  },

  deleteDashboard(dashboardId: string): Promise<void> {
    return api.delete(`/api/dashboard/${dashboardId}`).then(() => undefined);
  },

  getDeviceKeys(deviceId: string, scope: 'timeseries' | 'attributes'): Promise<string[]> {
    return api.get(`/api/plugins/telemetry/DEVICE/${deviceId}/keys/${scope}`).then((r) => r.data);
  },

  getDeviceTimeseries(
    deviceId: string,
    keys: string,
    startTs: number,
    endTs: number,
    limit?: number,
    agg?: string,
    interval?: number,
  ): Promise<Record<string, Array<{ ts: number; value: string }>>> {
    const params: Record<string, string> = {
      keys,
      startTs: String(startTs),
      endTs: String(endTs),
    };
    if (limit) params.limit = String(limit);
    if (agg) params.agg = agg;
    if (interval) params.interval = String(interval);
    return api.get(`/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries`, { params }).then((r) => r.data);
  },

  getDeviceLatestTimeseries(
    deviceId: string,
    keys?: string,
  ): Promise<Record<string, Array<{ ts: number; value: string }>>> {
    const params: Record<string, string> = {};
    if (keys) params.keys = keys;
    return api.get(`/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries`, { params }).then((r) => r.data);
  },

  getDeviceAttributes(
    deviceId: string,
    scope: 'CLIENT_SCOPE' | 'SHARED_SCOPE' | 'SERVER_SCOPE',
    keys?: string,
  ): Promise<Array<{ key: string; value: unknown; lastUpdateTs: number }>> {
    const params: Record<string, string> = {};
    if (keys) params.keys = keys;
    return api.get(`/api/plugins/telemetry/DEVICE/${deviceId}/values/attributes/${scope}`, { params }).then((r) => r.data);
  },
};
