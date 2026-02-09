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
 * QUERY Intent Handler
 * Handles device state query requests from Google Assistant
 */

import { SmartHomeV1QueryRequest, SmartHomeV1QueryResponse } from 'actions-on-google';
import { ThingsBoardClient } from '../services/thingsboard-client';

/**
 * Handle QUERY intent - device state queries
 * Called when user asks about device state:
 * - "Is the living room light on?"
 * - "What's the thermostat temperature?"
 * - "Is the front door locked?"
 */
export async function handleQuery(
  body: SmartHomeV1QueryRequest,
  accessToken: string,
  thingsboardUrl: string
): Promise<SmartHomeV1QueryResponse> {
  console.log('Handling QUERY intent');

  const client = new ThingsBoardClient(thingsboardUrl);
  const devices: Record<string, any> = {};

  try {
    const input = body.inputs[0];
    const payload = input.payload;

    // Query state for each device
    for (const device of payload.devices) {
      const deviceId = device.id;

      try {
        console.log(`Querying state for device ${deviceId}`);

        // Query device state from ThingsBoard
        const deviceState = await client.queryDeviceState(deviceId, accessToken);

        devices[deviceId] = {
          online: deviceState.online,
          status: 'SUCCESS',
          ...deviceState.state, // Spread state properties
        };

        console.log(`State queried successfully for device ${deviceId}`);
      } catch (error: any) {
        console.error(`Error querying state for device ${deviceId}:`, error.message);

        devices[deviceId] = {
          online: false,
          status: 'ERROR',
          errorCode: 'deviceOffline',
        };
      }
    }
  } catch (error: any) {
    console.error('Error handling QUERY intent:', error.message);
  }

  return {
    requestId: body.requestId,
    payload: {
      devices: devices,
    },
  };
}
