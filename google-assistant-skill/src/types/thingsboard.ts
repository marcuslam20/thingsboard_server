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
 * ThingsBoard API types
 */

export interface TBDevice {
  id: string;
  name: string;
  label?: string;
  type: string;
  googleCapabilities?: GoogleCapabilities;
  active: boolean;
  createdTime: number;
}

export interface GoogleCapabilities {
  enabled: boolean;
  deviceType: string;
  traits: string[];
  attributes?: Record<string, any>;
  willReportState?: boolean;
  roomHint?: string;
  nicknames?: string[];
}

export interface TBRpcCommand {
  method: string;
  params: Record<string, any>;
  timeout?: number;
}

export interface TBRpcResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface TBDeviceState {
  online: boolean;
  state: Record<string, any>;
}
