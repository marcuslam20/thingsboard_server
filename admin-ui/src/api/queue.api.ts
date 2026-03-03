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
