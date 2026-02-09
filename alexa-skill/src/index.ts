/**
 * Alexa Smart Home Skill Lambda Handler
 * Entry point for all Alexa Smart Home directives
 */

import { handleDiscovery } from './handlers/discovery';
import { handlePowerController } from './handlers/powerController';
import { handleAuthorization } from './handlers/authorization';
import { handleStateReport } from './handlers/stateReport';
import { AlexaRequest, AlexaResponse, AlexaErrorResponse } from './types/alexa';

export const handler = async (event: AlexaRequest): Promise<AlexaResponse | AlexaErrorResponse> => {
  console.log('Received Alexa directive:', JSON.stringify(event, null, 2));

  try {
    const namespace = event.directive.header.namespace;
    const name = event.directive.header.name;

    switch (namespace) {
      case 'Alexa.Discovery':
        return await handleDiscovery(event);

      case 'Alexa.PowerController':
        return await handlePowerController(event);

      case 'Alexa.Authorization':
        return await handleAuthorization(event);

      case 'Alexa':
        if (name === 'ReportState') {
          return await handleStateReport(event);
        }
        throw new Error(`Unsupported Alexa directive: ${name}`);

      default:
        console.error(`Unsupported namespace: ${namespace}`);
        return createErrorResponse(
          event,
          'INVALID_DIRECTIVE',
          `Unsupported namespace: ${namespace}`
        );
    }
  } catch (error) {
    console.error('Error handling directive:', error);
    return createErrorResponse(
      event,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

function createErrorResponse(
  event: AlexaRequest,
  type: string,
  message: string
): AlexaErrorResponse {
  return {
    event: {
      header: {
        namespace: 'Alexa',
        name: 'ErrorResponse',
        messageId: event.directive.header.messageId + '-R',
        payloadVersion: '3'
      },
      endpoint: event.directive.endpoint,
      payload: {
        type,
        message
      }
    }
  };
}
