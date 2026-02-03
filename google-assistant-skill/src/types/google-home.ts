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
 * Google Smart Home API types
 * Based on https://developers.google.com/assistant/smarthome/reference/intent
 */

export interface SmartHomeRequest {
  requestId: string;
  inputs: SmartHomeInput[];
}

export interface SmartHomeInput {
  intent: string;
  payload?: any;
}

export interface SmartHomeResponse {
  requestId: string;
  payload: any;
}

// SYNC Intent Types
export interface SyncResponse {
  requestId: string;
  payload: {
    agentUserId: string;
    devices: SyncDevice[];
  };
}

export interface SyncDevice {
  id: string;
  type: string;
  traits: string[];
  name: {
    defaultNames: string[];
    name: string;
    nicknames: string[];
  };
  willReportState: boolean;
  roomHint?: string;
  deviceInfo?: {
    manufacturer: string;
    model: string;
    hwVersion: string;
    swVersion: string;
  };
  attributes?: Record<string, any>;
  customData?: Record<string, any>;
}

// EXECUTE Intent Types
export interface ExecuteRequest {
  requestId: string;
  inputs: ExecuteInput[];
}

export interface ExecuteInput {
  intent: 'action.devices.EXECUTE';
  payload: {
    commands: ExecuteCommand[];
  };
}

export interface ExecuteCommand {
  devices: Array<{ id: string; customData?: any }>;
  execution: Array<{
    command: string;
    params: Record<string, any>;
  }>;
}

export interface ExecuteResponse {
  requestId: string;
  payload: {
    commands: ExecuteResult[];
    errorCode?: string;
    debugString?: string;
  };
}

export interface ExecuteResult {
  ids: string[];
  status: 'SUCCESS' | 'PENDING' | 'OFFLINE' | 'ERROR';
  states?: Record<string, any>;
  errorCode?: string;
  debugString?: string;
}

// QUERY Intent Types
export interface QueryRequest {
  requestId: string;
  inputs: QueryInput[];
}

export interface QueryInput {
  intent: 'action.devices.QUERY';
  payload: {
    devices: Array<{ id: string; customData?: any }>;
  };
}

export interface QueryResponse {
  requestId: string;
  payload: {
    devices: Record<string, DeviceState>;
    errorCode?: string;
    debugString?: string;
  };
}

export interface DeviceState {
  online: boolean;
  status: 'SUCCESS' | 'OFFLINE' | 'ERROR';
  errorCode?: string;
  [key: string]: any; // Dynamic state properties
}

// DISCONNECT Intent Types
export interface DisconnectResponse {
  requestId: string;
}
