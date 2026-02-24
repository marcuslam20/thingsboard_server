import api from './client';

export interface ApiUsageValue {
  [key: string]: Array<[number, string]>;
}

export interface UsageInfo {
  transportMsgCount?: number;
  transportMsgLimit?: number;
  transportDataPointsCount?: number;
  transportDataPointsLimit?: number;
  storageDataPointsCount?: number;
  storageDataPointsLimit?: number;
  ruleEngineExecutionCount?: number;
  ruleEngineExecutionLimit?: number;
  jsExecutionCount?: number;
  jsExecutionLimit?: number;
  tbelExecutionCount?: number;
  tbelExecutionLimit?: number;
  emailCount?: number;
  emailLimit?: number;
  smsCount?: number;
  smsLimit?: number;
  createdAlarmsCount?: number;
  createdAlarmsLimit?: number;
  transportApiState?: string;
  dbApiState?: string;
  ruleEngineApiState?: string;
  jsExecutionApiState?: string;
  tbelExecutionApiState?: string;
  emailApiState?: string;
  notificationApiState?: string;
  alarmApiState?: string;
}

export const usageApi = {
  getUsageInfo(): Promise<UsageInfo> {
    return api.get('/api/usage').then((r) => r.data);
  },
};
