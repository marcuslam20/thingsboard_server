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
 * Alexa PowerController Handler
 * Handles TurnOn and TurnOff directives
 */

import { v4 as uuid } from 'uuid';
import { ThingsBoardClient } from '../services/thingsboard-client';
import { extractAccessToken } from '../services/token-extractor';
import { AlexaRequest, AlexaResponse } from '../types/alexa';

export async function handlePowerController(event: AlexaRequest): Promise<AlexaResponse> {
  const directive = event.directive.header.name;
  const endpointId = event.directive.endpoint?.endpointId;
  const correlationToken = event.directive.header.correlationToken;

  console.log(`Handling PowerController ${directive} for device ${endpointId}`);

  if (!endpointId) {
    throw new Error('No endpoint ID provided');
  }

  // Determine power state from directive
  const powerState = directive === 'TurnOn';

  try {
    // Extract per-user OAuth2 token from the Alexa event
    const accessToken = extractAccessToken(event);

    // Initialize ThingsBoard client with the user's token
    const client = new ThingsBoardClient();
    client.setAccessToken(accessToken);

    // Execute command via the skill endpoint (per-user scoped)
    await client.executeAlexaSkillCommand(endpointId, 'setPower', powerState);

    console.log(`Successfully set power state to ${powerState} for device ${endpointId}`);

    // Return success response with updated state
    return {
      event: {
        header: {
          namespace: 'Alexa',
          name: 'Response',
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
        properties: [
          {
            namespace: 'Alexa.PowerController',
            name: 'powerState',
            value: powerState ? 'ON' : 'OFF',
            timeOfSample: new Date().toISOString(),
            uncertaintyInMilliseconds: 500
          }
        ]
      }
    };
  } catch (error) {
    console.error(`Failed to set power state for device ${endpointId}:`, error);
    throw error;
  }
}
