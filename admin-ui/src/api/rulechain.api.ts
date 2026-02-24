import api from './client';
import { PageData, PageLink, pageLinkToQueryParams } from '@/models/page.model';

export interface RuleChain {
  id?: { id: string; entityType: string };
  createdTime?: number;
  tenantId?: { id: string; entityType: string };
  name: string;
  type?: string;
  firstRuleNodeId?: { id: string; entityType: string } | null;
  root?: boolean;
  debugMode?: boolean;
  configuration?: unknown;
  additionalInfo?: { description?: string; [key: string]: unknown };
}

export const rulechainApi = {
  getRuleChains(pl: PageLink, type = 'CORE'): Promise<PageData<RuleChain>> {
    return api.get('/api/ruleChains', { params: { ...pageLinkToQueryParams(pl), type } }).then((r) => r.data);
  },

  getRuleChain(ruleChainId: string): Promise<RuleChain> {
    return api.get(`/api/ruleChain/${ruleChainId}`).then((r) => r.data);
  },

  saveRuleChain(ruleChain: Partial<RuleChain>): Promise<RuleChain> {
    return api.post('/api/ruleChain', ruleChain).then((r) => r.data);
  },

  deleteRuleChain(ruleChainId: string): Promise<void> {
    return api.delete(`/api/ruleChain/${ruleChainId}`).then(() => undefined);
  },

  setRootRuleChain(ruleChainId: string): Promise<RuleChain> {
    return api.post(`/api/ruleChain/${ruleChainId}/root`).then((r) => r.data);
  },

  exportRuleChain(ruleChainId: string): Promise<{ ruleChain: RuleChain; metadata: unknown }> {
    return Promise.all([
      api.get(`/api/ruleChain/${ruleChainId}`).then((r) => r.data),
      api.get(`/api/ruleChain/${ruleChainId}/metadata`).then((r) => r.data),
    ]).then(([ruleChain, metadata]) => ({ ruleChain, metadata }));
  },

  importRuleChain(data: { ruleChain: Partial<RuleChain>; metadata: unknown }): Promise<RuleChain> {
    return api.post('/api/ruleChain', data.ruleChain).then((r) => r.data);
  },
};
