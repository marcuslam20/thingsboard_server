/**
 * SYNC Intent Handler
 * Handles device discovery requests from Google Assistant
 */

import { SmartHomeV1SyncRequest, SmartHomeV1SyncResponse } from 'actions-on-google';
import { ThingsBoardClient } from '../services/thingsboard-client';
import { mapDevicesToGoogleDevices } from '../services/device-mapper';

/**
 * Handle SYNC intent - device discovery
 * Called when:
 * - User links their account
 * - User says "Hey Google, sync my devices"
 * - Periodically by Google to refresh device list
 */
export async function handleSync(
  body: SmartHomeV1SyncRequest,
  accessToken: string,
  thingsboardUrl: string
): Promise<SmartHomeV1SyncResponse> {
  console.log('Handling SYNC intent');

  try {
    const client = new ThingsBoardClient(thingsboardUrl);

    // Fetch all Google-enabled devices from ThingsBoard
    const tbDevices = await client.getGoogleDevices(accessToken);
    console.log(`Found ${tbDevices.length} Google-enabled devices`);

    // Map ThingsBoard devices to Google Smart Home format
    const googleDevices = mapDevicesToGoogleDevices(tbDevices);

    // Return SYNC response
    return {
      requestId: body.requestId,
      payload: {
        agentUserId: 'thingsboard-user', // Could use tenant ID here
        devices: googleDevices,
      },
    };
  } catch (error: any) {
    console.error('Error handling SYNC intent:', error.message);

    // Return empty device list on error
    return {
      requestId: body.requestId,
      payload: {
        agentUserId: 'thingsboard-user',
        devices: [],
      },
    };
  }
}
