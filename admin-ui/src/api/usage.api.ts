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
