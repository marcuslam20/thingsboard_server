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
