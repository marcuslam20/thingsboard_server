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
