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
