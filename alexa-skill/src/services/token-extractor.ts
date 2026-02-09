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
