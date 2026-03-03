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
