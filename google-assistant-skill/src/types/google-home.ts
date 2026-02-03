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
