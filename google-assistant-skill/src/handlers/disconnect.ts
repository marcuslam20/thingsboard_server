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
