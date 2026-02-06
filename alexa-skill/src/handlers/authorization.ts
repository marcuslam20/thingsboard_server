/**
 * Alexa Authorization Handler
 * Handles account linking and authorization
 */

import { v4 as uuid } from 'uuid';
import { AlexaRequest, AlexaResponse } from '../types/alexa';

export async function handleAuthorization(event: AlexaRequest): Promise<AlexaResponse> {
  const name = event.directive.header.name;

  console.log(`Handling Authorization ${name}`);

  if (name === 'AcceptGrant') {
    // Handle OAuth grant acceptance
    const grantCode = event.directive.payload?.grant?.code;
    const grantee = event.directive.payload?.grantee;

    console.log('AcceptGrant received:', { grantCode: grantCode?.substring(0, 10) + '...', grantee });

    // In a production implementation, you would:
    // 1. Exchange the grant code for access/refresh tokens
    // 2. Store the tokens securely (e.g., in DynamoDB)
    // 3. Associate tokens with the user

    return {
      event: {
        header: {
          namespace: 'Alexa.Authorization',
          name: 'AcceptGrant.Response',
          messageId: uuid(),
          payloadVersion: '3'
        },
        payload: {}
      }
    };
  }

  throw new Error(`Unsupported authorization directive: ${name}`);
}
