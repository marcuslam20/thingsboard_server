import api from './client';
import { PageData, PageLink, pageLinkToQueryParams } from '@/models/page.model';

export interface AuditLog {
  id: { id: string; entityType: string };
  createdTime: number;
  tenantId: { id: string; entityType: string };
  entityId: { id: string; entityType: string };
  entityName: string;
  userId: { id: string; entityType: string };
  userName: string;
  actionType: string;
  actionData?: Record<string, unknown>;
  actionStatus: string;
  actionFailureDetails?: string;
}

export const auditLogApi = {
  getAuditLogs(pl: PageLink): Promise<PageData<AuditLog>> {
    return api.get('/api/audit/logs', { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getAuditLogsByEntityId(entityType: string, entityId: string, pl: PageLink): Promise<PageData<AuditLog>> {
    return api.get(`/api/audit/logs/entity/${entityType}/${entityId}`, { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getAuditLogsByUserId(userId: string, pl: PageLink): Promise<PageData<AuditLog>> {
    return api.get(`/api/audit/logs/user/${userId}`, { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getAuditLogsByCustomerId(customerId: string, pl: PageLink): Promise<PageData<AuditLog>> {
    return api.get(`/api/audit/logs/customer/${customerId}`, { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },
};
