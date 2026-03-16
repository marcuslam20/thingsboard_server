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
 * Alexa Smart Home Skill Lambda Handler
 * Entry point for all Alexa Smart Home directives
 */

import { handleDiscovery } from './handlers/discovery';
import { handleDirective } from './handlers/directiveHandler';
import { handleAuthorization } from './handlers/authorization';
import { handleStateReport } from './handlers/stateReport';
import { handleSkillEvent, SkillEvent } from './handlers/skillEventHandler';
import { AlexaRequest, AlexaResponse, AlexaErrorResponse } from './types/alexa';

/** Namespaces that map to device control directives (handled by directiveHandler) */
const CONTROL_NAMESPACES = new Set([
  'Alexa.PowerController',
  'Alexa.BrightnessController',
  'Alexa.ColorController',
  'Alexa.ColorTemperatureController',
  'Alexa.PercentageController',
  'Alexa.ThermostatController',
  'Alexa.LockController',
  'Alexa.RangeController',
]);

export const handler = async (event: AlexaRequest | SkillEvent): Promise<AlexaResponse | AlexaErrorResponse | void> => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Skill Events (SkillDisabled, SkillAccountLinked) have a different structure:
  // they use event.request.type = "AlexaSkillEvent.SkillDisabled" instead of event.directive
  const skillEvent = event as any;
  if (skillEvent.request?.type?.startsWith('AlexaSkillEvent.')) {
    await handleSkillEvent(skillEvent as SkillEvent);
    return;
  }

  const alexaEvent = event as AlexaRequest;

  try {
    const namespace = alexaEvent.directive.header.namespace;
    const name = alexaEvent.directive.header.name;

    // Discovery
    if (namespace === 'Alexa.Discovery') {
      return await handleDiscovery(alexaEvent);
    }

    // Authorization (account linking)
    if (namespace === 'Alexa.Authorization') {
      return await handleAuthorization(alexaEvent);
    }

    // ReportState
    if (namespace === 'Alexa' && name === 'ReportState') {
      return await handleStateReport(alexaEvent);
    }

    // All device control directives
    if (CONTROL_NAMESPACES.has(namespace)) {
      return await handleDirective(alexaEvent);
    }

    // Unsupported
    console.error(`Unsupported namespace: ${namespace}, name: ${name}`);
    return createErrorResponse(
      alexaEvent,
      'INVALID_DIRECTIVE',
      `Unsupported namespace: ${namespace}`
    );
  } catch (error) {
    console.error('Error handling directive:', error);
    return createErrorResponse(
      alexaEvent,
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
