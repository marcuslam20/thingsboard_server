/**
 * Alexa Smart Home API Types
 * Based on Alexa Smart Home Skill API v3
 */

export interface AlexaHeader {
  namespace: string;
  name: string;
  messageId: string;
  correlationToken?: string;
  payloadVersion: string;
}

export interface AlexaEndpoint {
  endpointId: string;
  scope?: {
    type: string;
    token: string;
  };
  cookie?: Record<string, string>;
}

export interface AlexaRequest {
  directive: {
    header: AlexaHeader;
    endpoint?: AlexaEndpoint;
    payload: Record<string, any>;
  };
}

export interface AlexaCapability {
  type: string;
  interface: string;
  version: string;
  properties?: {
    supported: Array<{ name: string }>;
    proactivelyReported: boolean;
    retrievable: boolean;
  };
  configuration?: Record<string, any>;
}

export interface AlexaEndpointConfig {
  endpointId: string;
  manufacturerName: string;
  friendlyName: string;
  description: string;
  displayCategories: string[];
  capabilities: AlexaCapability[];
  cookie?: Record<string, string>;
}

export interface AlexaDiscoveryResponse {
  event: {
    header: AlexaHeader;
    payload: {
      endpoints: AlexaEndpointConfig[];
    };
  };
}

export interface AlexaProperty {
  namespace: string;
  name: string;
  value: any;
  timeOfSample: string;
  uncertaintyInMilliseconds: number;
}

export interface AlexaResponse {
  event: {
    header: AlexaHeader;
    endpoint?: AlexaEndpoint;
    payload: Record<string, any>;
  };
  context?: {
    properties: AlexaProperty[];
  };
}

export interface AlexaErrorResponse {
  event: {
    header: AlexaHeader;
    endpoint?: AlexaEndpoint;
    payload: {
      type: string;
      message: string;
    };
  };
}

export type AlexaDisplayCategory =
  | 'LIGHT'
  | 'SWITCH'
  | 'SMARTPLUG'
  | 'THERMOSTAT'
  | 'TEMPERATURE_SENSOR'
  | 'CONTACT_SENSOR'
  | 'MOTION_SENSOR'
  | 'OTHER';
