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
