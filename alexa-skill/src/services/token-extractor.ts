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
 * Utility for extracting OAuth2 access tokens from Alexa directive events.
 */

import { AlexaRequest } from '../types/alexa';

/**
 * Extract the user's OAuth2 access token from an Alexa directive event.
 *
 * - For Discovery directives: token is in `payload.scope.token`
 * - For other directives (PowerController, StateReport, etc.): token is in `endpoint.scope.token`
 *
 * @param event The Alexa directive event
 * @returns The OAuth2 access token
 * @throws Error if no token is found in the event
 */
export function extractAccessToken(event: AlexaRequest): string {
  // Try endpoint scope first (most directives)
  const endpointToken = event.directive.endpoint?.scope?.token;
  if (endpointToken) {
    return endpointToken;
  }

  // Try payload scope (Discovery directive)
  const payloadToken = event.directive.payload?.scope?.token;
  if (payloadToken) {
    return payloadToken;
  }

  throw new Error('No access token found in Alexa directive');
}
