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
