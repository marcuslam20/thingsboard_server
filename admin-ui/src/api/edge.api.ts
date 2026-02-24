import api from './client';
import { PageData, PageLink, pageLinkToQueryParams } from '@/models/page.model';

export interface Edge {
  id: { id: string; entityType: string };
  createdTime: number;
  tenantId: { id: string; entityType: string };
  customerId?: { id: string; entityType: string };
  name: string;
  type: string;
  label?: string;
  routingKey?: string;
  secret?: string;
  additionalInfo?: Record<string, unknown>;
}

export interface EdgeInfo extends Edge {
  customerTitle?: string;
  customerIsPublic?: boolean;
}

export const edgeApi = {
  getTenantEdgeInfos(pl: PageLink, type?: string): Promise<PageData<EdgeInfo>> {
    const params: Record<string, string> = pageLinkToQueryParams(pl);
    if (type) params.type = type;
    return api.get('/api/tenant/edgeInfos', { params }).then((r) => r.data);
  },

  getEdge(edgeId: string): Promise<Edge> {
    return api.get(`/api/edge/${edgeId}`).then((r) => r.data);
  },

  getEdgeInfo(edgeId: string): Promise<EdgeInfo> {
    return api.get(`/api/edge/info/${edgeId}`).then((r) => r.data);
  },

  saveEdge(edge: Partial<Edge>): Promise<Edge> {
    return api.post('/api/edge', edge).then((r) => r.data);
  },

  deleteEdge(edgeId: string): Promise<void> {
    return api.delete(`/api/edge/${edgeId}`).then(() => undefined);
  },

  getEdgeTypes(): Promise<Array<{ tenantId: { id: string }; entityType: string; type: string }>> {
    return api.get('/api/edge/types').then((r) => r.data);
  },

  assignEdgeToCustomer(customerId: string, edgeId: string): Promise<Edge> {
    return api.post(`/api/customer/${customerId}/edge/${edgeId}`).then((r) => r.data);
  },

  unassignEdgeFromCustomer(edgeId: string): Promise<void> {
    return api.delete(`/api/customer/edge/${edgeId}`).then(() => undefined);
  },

  getEdgeDevices(edgeId: string, pl: PageLink): Promise<PageData<unknown>> {
    return api.get(`/api/edge/${edgeId}/devices`, { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getEdgeAssets(edgeId: string, pl: PageLink): Promise<PageData<unknown>> {
    return api.get(`/api/edge/${edgeId}/assets`, { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getEdgeDashboards(edgeId: string, pl: PageLink): Promise<PageData<unknown>> {
    return api.get(`/api/edge/${edgeId}/dashboards`, { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getEdgeRuleChains(edgeId: string, pl: PageLink): Promise<PageData<unknown>> {
    return api.get(`/api/edge/${edgeId}/ruleChains`, { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },
};
