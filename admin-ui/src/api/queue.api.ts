import api from './client';
import { PageData, PageLink, pageLinkToQueryParams } from '@/models/page.model';

export interface QueueInfo {
  id: { id: string; entityType: string };
  createdTime: number;
  tenantId: { id: string; entityType: string };
  name: string;
  topic: string;
  pollInterval: number;
  partitions: number;
  consumerPerPartition: boolean;
  packProcessingTimeout: number;
  submitStrategy: { type: string; batchSize?: number };
  processingStrategy: {
    type: string;
    retries?: number;
    failurePercentage?: number;
    pauseBetweenRetries?: number;
    maxPauseBetweenRetries?: number;
  };
  additionalInfo?: Record<string, unknown>;
}

export const queueApi = {
  getQueues(pl: PageLink, serviceType = 'TB_RULE_ENGINE'): Promise<PageData<QueueInfo>> {
    return api.get('/api/queues', { params: { ...pageLinkToQueryParams(pl), serviceType } }).then((r) => r.data);
  },

  getQueue(queueId: string): Promise<QueueInfo> {
    return api.get(`/api/queues/${queueId}`).then((r) => r.data);
  },

  saveQueue(queue: Partial<QueueInfo>, serviceType = 'TB_RULE_ENGINE'): Promise<QueueInfo> {
    return api.post('/api/queues', queue, { params: { serviceType } }).then((r) => r.data);
  },

  deleteQueue(queueId: string): Promise<void> {
    return api.delete(`/api/queues/${queueId}`).then(() => undefined);
  },
};
