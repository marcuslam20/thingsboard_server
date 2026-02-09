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
