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

/**
 * ThingsBoard API Types
 */

export interface TBLoginRequest {
  username: string;
  password: string;
}

export interface TBLoginResponse {
  token: string;
  refreshToken: string;
}

export interface TBDevice {
  id: {
    id: string;
    entityType: string;
  };
  createdTime: number;
  tenantId: {
    id: string;
    entityType: string;
  };
  customerId?: {
    id: string;
    entityType: string;
  };
  name: string;
  type: string;
  label?: string;
  deviceProfileId: {
    id: string;
    entityType: string;
  };
  deviceData?: {
    configuration?: Record<string, any>;
    transportConfiguration?: Record<string, any>;
  };
  additionalInfo?: Record<string, any>;
}

export interface TBAlexaDevice {
  id: string;
  name: string;
  type: string;
  label?: string;
  alexaCapabilities: TBAlexaCapabilities;
}

export interface TBAlexaCapabilities {
  enabled: boolean;
  category: string;
  powerState?: boolean;
  brightness?: number;
}

export interface TBRpcRequest {
  method: string;
  params: Record<string, any>;
  timeout?: number;
  persistent?: boolean;
  retries?: number;
}

export interface TBRpcResponse {
  id?: string;
  result?: any;
  error?: string;
}

export interface TBTelemetry {
  [key: string]: Array<{
    ts: number;
    value: any;
  }>;
}
