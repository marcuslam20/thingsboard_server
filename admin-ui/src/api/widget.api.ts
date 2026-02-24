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
