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
 * Alexa State Report Handler
 * Handles ReportState requests for device state queries
 */

import { v4 as uuid } from 'uuid';
import { ThingsBoardClient } from '../services/thingsboard-client';
import { extractAccessToken } from '../services/token-extractor';
import { AlexaRequest, AlexaResponse, AlexaProperty } from '../types/alexa';

export async function handleStateReport(event: AlexaRequest): Promise<AlexaResponse> {
  const endpointId = event.directive.endpoint?.endpointId;
  const correlationToken = event.directive.header.correlationToken;

  console.log(`Handling StateReport for device ${endpointId}`);

  if (!endpointId) {
    throw new Error('No endpoint ID provided');
  }

  try {
    // Extract per-user OAuth2 token from the Alexa event
    const accessToken = extractAccessToken(event);

    // Initialize ThingsBoard client with the user's token
    const client = new ThingsBoardClient();
    client.setAccessToken(accessToken);

    // Get device info and latest telemetry via skill endpoints (per-user scoped)
    const device = await client.getAlexaSkillDevice(endpointId);
    const telemetry = await client.getAlexaSkillTelemetry(endpointId, ['powerState', 'brightness', 'temperature']);

    // Build properties array based on available telemetry
    const properties: AlexaProperty[] = [];
    const timestamp = new Date().toISOString();

    // Power state
    if (telemetry.powerState && telemetry.powerState.length > 0) {
      const powerValue = telemetry.powerState[0].value;
      properties.push({
        namespace: 'Alexa.PowerController',
        name: 'powerState',
        value: powerValue ? 'ON' : 'OFF',
        timeOfSample: timestamp,
        uncertaintyInMilliseconds: 1000
      });
    } else if (device.alexaCapabilities?.powerState !== undefined) {
      properties.push({
        namespace: 'Alexa.PowerController',
        name: 'powerState',
        value: device.alexaCapabilities.powerState ? 'ON' : 'OFF',
        timeOfSample: timestamp,
        uncertaintyInMilliseconds: 1000
      });
    }

    // Brightness
    if (telemetry.brightness && telemetry.brightness.length > 0) {
      properties.push({
        namespace: 'Alexa.BrightnessController',
        name: 'brightness',
        value: telemetry.brightness[0].value,
        timeOfSample: timestamp,
        uncertaintyInMilliseconds: 1000
      });
    }

    // Temperature
    if (telemetry.temperature && telemetry.temperature.length > 0) {
      properties.push({
        namespace: 'Alexa.TemperatureSensor',
        name: 'temperature',
        value: {
          value: telemetry.temperature[0].value,
          scale: 'CELSIUS'
        },
        timeOfSample: timestamp,
        uncertaintyInMilliseconds: 1000
      });
    }

    // Endpoint health (connectivity)
    properties.push({
      namespace: 'Alexa.EndpointHealth',
      name: 'connectivity',
      value: {
        value: 'OK'
      },
      timeOfSample: timestamp,
      uncertaintyInMilliseconds: 0
    });

    return {
      event: {
        header: {
          namespace: 'Alexa',
          name: 'StateReport',
          messageId: uuid(),
          correlationToken,
          payloadVersion: '3'
        },
        endpoint: {
          endpointId
        },
        payload: {}
      },
      context: {
        properties
      }
    };
  } catch (error) {
    console.error(`Failed to get state for device ${endpointId}:`, error);
    throw error;
  }
}
