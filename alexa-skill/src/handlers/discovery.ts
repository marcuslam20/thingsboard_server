/**
 * Alexa Discovery Handler
 * Handles device discovery requests from Alexa
 */

import { v4 as uuid } from 'uuid';
import { ThingsBoardClient } from '../services/thingsboard-client';
import { mapDevicesToEndpoints } from '../services/device-mapper';
import { extractAccessToken } from '../services/token-extractor';
import { AlexaRequest, AlexaDiscoveryResponse } from '../types/alexa';

export async function handleDiscovery(event: AlexaRequest): Promise<AlexaDiscoveryResponse> {
  console.log('Handling discovery request');

  try {
    // Extract per-user OAuth2 token from the Alexa event
    const accessToken = extractAccessToken(event);

    // Initialize ThingsBoard client with the user's token
    const client = new ThingsBoardClient();
    client.setAccessToken(accessToken);

    // Get Alexa-enabled devices scoped to this user
    const devices = await client.getAlexaSkillDevices();
    console.log(`Found ${devices.length} Alexa-enabled devices`);

    // Map devices to Alexa endpoint format
    const endpoints = mapDevicesToEndpoints(devices);
    console.log(`Mapped ${endpoints.length} endpoints for Alexa`);

    return {
      event: {
        header: {
          namespace: 'Alexa.Discovery',
          name: 'Discover.Response',
          payloadVersion: '3',
          messageId: uuid()
        },
        payload: {
          endpoints
        }
      }
    };
  } catch (error) {
    console.error('Discovery failed:', error);

    // Return empty endpoints on error
    return {
      event: {
        header: {
          namespace: 'Alexa.Discovery',
          name: 'Discover.Response',
          payloadVersion: '3',
          messageId: uuid()
        },
        payload: {
          endpoints: []
        }
      }
    };
  }
}
