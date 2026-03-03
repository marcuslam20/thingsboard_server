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
