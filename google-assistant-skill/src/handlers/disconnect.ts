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
 * DISCONNECT Intent Handler
 * Handles account unlinking requests from Google Assistant
 */

import { SmartHomeV1DisconnectRequest, SmartHomeV1DisconnectResponse } from 'actions-on-google';

/**
 * Handle DISCONNECT intent - account unlinking
 * Called when user unlinks their ThingsBoard account from Google Home
 */
export async function handleDisconnect(
  body: SmartHomeV1DisconnectRequest,
  accessToken: string,
  thingsboardUrl: string
): Promise<SmartHomeV1DisconnectResponse> {
  console.log('Handling DISCONNECT intent');

  try {
    // Note: The actual token revocation is handled by ThingsBoard backend
    // when Google calls the /oauth/revoke endpoint
    console.log('Account disconnected successfully');
  } catch (error: any) {
    console.error('Error handling DISCONNECT intent:', error.message);
  }

  // Always return success for DISCONNECT
  return {};
}
