import api from './client';
import { PageData, PageLink, pageLinkToQueryParams } from '@/models/page.model';

export interface AlarmInfo {
  id: { id: string; entityType: string };
  createdTime: number;
  tenantId: { id: string; entityType: string };
  type: string;
  originator: { id: string; entityType: string };
  originatorName?: string;
  severity: string;
  status: string;
  startTs: number;
  endTs: number;
  ackTs: number;
  clearTs: number;
  assigneeId?: { id: string; entityType: string };
  details?: Record<string, unknown>;
}

export type AlarmSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INDETERMINATE';
export type AlarmStatus = 'ACTIVE_UNACK' | 'ACTIVE_ACK' | 'CLEARED_UNACK' | 'CLEARED_ACK';

export const alarmApi = {
  getAllAlarms(pl: PageLink, status?: string, severity?: string): Promise<PageData<AlarmInfo>> {
    const params: Record<string, string> = pageLinkToQueryParams(pl);
    if (status) params.status = status;
    if (severity) params.severity = severity;
    return api.get('/api/alarms', { params }).then((r) => r.data);
  },

  getAlarm(alarmId: string): Promise<AlarmInfo> {
    return api.get(`/api/alarm/${alarmId}`).then((r) => r.data);
  },

  ackAlarm(alarmId: string): Promise<void> {
    return api.post(`/api/alarm/${alarmId}/ack`).then(() => undefined);
  },

  clearAlarm(alarmId: string): Promise<void> {
    return api.post(`/api/alarm/${alarmId}/clear`).then(() => undefined);
  },

  deleteAlarm(alarmId: string): Promise<void> {
    return api.delete(`/api/alarm/${alarmId}`).then(() => undefined);
  },
};
