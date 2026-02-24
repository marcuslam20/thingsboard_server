import api from './client';

export type AttributeScope = 'SERVER_SCOPE' | 'SHARED_SCOPE' | 'CLIENT_SCOPE';

export interface AttributeData {
  lastUpdateTs: number;
  key: string;
  value: unknown;
}

export interface TimeseriesData {
  [key: string]: Array<{ ts: number; value: string }>;
}

export const attributeApi = {
  getEntityAttributes(entityType: string, entityId: string, scope: AttributeScope, keys?: string): Promise<AttributeData[]> {
    let url = `/api/plugins/telemetry/${entityType}/${entityId}/values/attributes/${scope}`;
    if (keys) url += `?keys=${keys}`;
    return api.get(url).then((r) => r.data);
  },

  getEntityTimeseries(entityType: string, entityId: string, keys: string, startTs: number, endTs: number, limit = 100): Promise<TimeseriesData> {
    return api.get(`/api/plugins/telemetry/${entityType}/${entityId}/values/timeseries`, {
      params: { keys, startTs: String(startTs), endTs: String(endTs), limit: String(limit) },
    }).then((r) => r.data);
  },

  getLatestTimeseries(entityType: string, entityId: string, keys?: string): Promise<TimeseriesData> {
    let url = `/api/plugins/telemetry/${entityType}/${entityId}/values/timeseries`;
    if (keys) url += `?keys=${keys}`;
    return api.get(url).then((r) => r.data);
  },

  getTimeseriesKeys(entityType: string, entityId: string): Promise<string[]> {
    return api.get(`/api/plugins/telemetry/${entityType}/${entityId}/keys/timeseries`).then((r) => r.data);
  },

  getAttributeKeys(entityType: string, entityId: string, scope: AttributeScope): Promise<string[]> {
    return api.get(`/api/plugins/telemetry/${entityType}/${entityId}/keys/attributes/${scope}`).then((r) => r.data);
  },

  saveEntityAttributes(entityType: string, entityId: string, scope: AttributeScope, attributes: Record<string, unknown>): Promise<void> {
    return api.post(`/api/plugins/telemetry/${entityType}/${entityId}/attributes/${scope}`, attributes).then(() => undefined);
  },

  deleteEntityAttributes(entityType: string, entityId: string, scope: AttributeScope, keys: string[]): Promise<void> {
    return api.delete(`/api/plugins/telemetry/${entityType}/${entityId}/attributes/${scope}`, {
      params: { keys: keys.join(',') },
    }).then(() => undefined);
  },
};
