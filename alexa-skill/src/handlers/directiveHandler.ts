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
 * Generic Alexa Directive Handler
 * Maps all Alexa Smart Home directives to ThingsBoard commands via DP system.
 *
 * Supported namespaces:
 * - Alexa.PowerController (TurnOn, TurnOff)
 * - Alexa.BrightnessController (SetBrightness, AdjustBrightness)
 * - Alexa.ColorController (SetColor)
 * - Alexa.ColorTemperatureController (SetColorTemperature, IncreaseColorTemperature, DecreaseColorTemperature)
 * - Alexa.PercentageController (SetPercentage, AdjustPercentage)
 * - Alexa.ThermostatController (SetTargetTemperature, AdjustTargetTemperature, SetThermostatMode)
 * - Alexa.LockController (Lock, Unlock)
 * - Alexa.RangeController (SetRangeValue, AdjustRangeValue)
 */

import { v4 as uuid } from 'uuid';
import { ThingsBoardClient } from '../services/thingsboard-client';
import { extractAccessToken } from '../services/token-extractor';
import { AlexaRequest, AlexaResponse, AlexaProperty } from '../types/alexa';

interface CommandMapping {
  command: string;
  value: any;
  responseProperties: AlexaProperty[];
}

/**
 * Map an Alexa directive to a ThingsBoard command + response properties.
 */
function mapDirectiveToCommand(event: AlexaRequest): CommandMapping {
  const namespace = event.directive.header.namespace;
  const name = event.directive.header.name;
  const payload = event.directive.payload;
  const timestamp = new Date().toISOString();

  switch (namespace) {
    // ==================== PowerController ====================
    case 'Alexa.PowerController': {
      const powerState = name === 'TurnOn';
      return {
        command: name, // TurnOn or TurnOff
        value: powerState,
        responseProperties: [{
          namespace: 'Alexa.PowerController',
          name: 'powerState',
          value: powerState ? 'ON' : 'OFF',
          timeOfSample: timestamp,
          uncertaintyInMilliseconds: 500
        }]
      };
    }

    // ==================== BrightnessController ====================
    case 'Alexa.BrightnessController': {
      if (name === 'SetBrightness') {
        const brightness = payload.brightness ?? 0;
        return {
          command: 'SetBrightness',
          value: brightness,
          responseProperties: [{
            namespace: 'Alexa.BrightnessController',
            name: 'brightness',
            value: brightness,
            timeOfSample: timestamp,
            uncertaintyInMilliseconds: 500
          }]
        };
      }
      if (name === 'AdjustBrightness') {
        const delta = payload.brightnessDelta ?? 0;
        return {
          command: 'AdjustBrightness',
          value: delta,
          responseProperties: [{
            namespace: 'Alexa.BrightnessController',
            name: 'brightness',
            value: 50, // approximate, backend will compute actual
            timeOfSample: timestamp,
            uncertaintyInMilliseconds: 3000
          }]
        };
      }
      throw new Error(`Unsupported BrightnessController directive: ${name}`);
    }

    // ==================== ColorController ====================
    case 'Alexa.ColorController': {
      // Alexa sends: { color: { hue: 350.5, saturation: 0.7138, brightness: 0.6524 } }
      const color = payload.color;
      return {
        command: 'SetColor',
        value: color,
        responseProperties: [{
          namespace: 'Alexa.ColorController',
          name: 'color',
          value: color,
          timeOfSample: timestamp,
          uncertaintyInMilliseconds: 500
        }]
      };
    }

    // ==================== ColorTemperatureController ====================
    case 'Alexa.ColorTemperatureController': {
      if (name === 'SetColorTemperature') {
        const tempK = payload.colorTemperatureInKelvin ?? 4000;
        return {
          command: 'SetColorTemperature',
          value: tempK,
          responseProperties: [{
            namespace: 'Alexa.ColorTemperatureController',
            name: 'colorTemperatureInKelvin',
            value: tempK,
            timeOfSample: timestamp,
            uncertaintyInMilliseconds: 500
          }]
        };
      }
      if (name === 'IncreaseColorTemperature') {
        return {
          command: 'IncreaseColorTemperature',
          value: 500, // step 500K
          responseProperties: [{
            namespace: 'Alexa.ColorTemperatureController',
            name: 'colorTemperatureInKelvin',
            value: 4500,
            timeOfSample: timestamp,
            uncertaintyInMilliseconds: 3000
          }]
        };
      }
      if (name === 'DecreaseColorTemperature') {
        return {
          command: 'DecreaseColorTemperature',
          value: -500,
          responseProperties: [{
            namespace: 'Alexa.ColorTemperatureController',
            name: 'colorTemperatureInKelvin',
            value: 3500,
            timeOfSample: timestamp,
            uncertaintyInMilliseconds: 3000
          }]
        };
      }
      throw new Error(`Unsupported ColorTemperatureController directive: ${name}`);
    }

    // ==================== PercentageController ====================
    case 'Alexa.PercentageController': {
      if (name === 'SetPercentage') {
        const percentage = payload.percentage ?? 0;
        return {
          command: 'SetPercentage',
          value: percentage,
          responseProperties: [{
            namespace: 'Alexa.PercentageController',
            name: 'percentage',
            value: percentage,
            timeOfSample: timestamp,
            uncertaintyInMilliseconds: 500
          }]
        };
      }
      if (name === 'AdjustPercentage') {
        const delta = payload.percentageDelta ?? 0;
        return {
          command: 'AdjustPercentage',
          value: delta,
          responseProperties: [{
            namespace: 'Alexa.PercentageController',
            name: 'percentage',
            value: 50,
            timeOfSample: timestamp,
            uncertaintyInMilliseconds: 3000
          }]
        };
      }
      throw new Error(`Unsupported PercentageController directive: ${name}`);
    }

    // ==================== ThermostatController ====================
    case 'Alexa.ThermostatController': {
      if (name === 'SetTargetTemperature') {
        const temp = payload.targetSetpoint?.value ?? 20;
        return {
          command: 'SetTemperature',
          value: temp,
          responseProperties: [{
            namespace: 'Alexa.ThermostatController',
            name: 'targetSetpoint',
            value: { value: temp, scale: payload.targetSetpoint?.scale ?? 'CELSIUS' },
            timeOfSample: timestamp,
            uncertaintyInMilliseconds: 500
          }]
        };
      }
      if (name === 'AdjustTargetTemperature') {
        const delta = payload.targetSetpointDelta?.value ?? 0;
        return {
          command: 'AdjustTemperature',
          value: delta,
          responseProperties: [{
            namespace: 'Alexa.ThermostatController',
            name: 'targetSetpoint',
            value: { value: 22, scale: 'CELSIUS' },
            timeOfSample: timestamp,
            uncertaintyInMilliseconds: 3000
          }]
        };
      }
      if (name === 'SetThermostatMode') {
        const mode = payload.thermostatMode?.value ?? 'AUTO';
        return {
          command: 'SetThermostatMode',
          value: mode,
          responseProperties: [{
            namespace: 'Alexa.ThermostatController',
            name: 'thermostatMode',
            value: mode,
            timeOfSample: timestamp,
            uncertaintyInMilliseconds: 500
          }]
        };
      }
      throw new Error(`Unsupported ThermostatController directive: ${name}`);
    }

    // ==================== LockController ====================
    case 'Alexa.LockController': {
      const lockState = name === 'Lock';
      return {
        command: name, // Lock or Unlock
        value: lockState,
        responseProperties: [{
          namespace: 'Alexa.LockController',
          name: 'lockState',
          value: lockState ? 'LOCKED' : 'UNLOCKED',
          timeOfSample: timestamp,
          uncertaintyInMilliseconds: 500
        }]
      };
    }

    // ==================== RangeController ====================
    case 'Alexa.RangeController': {
      if (name === 'SetRangeValue') {
        const rangeValue = payload.rangeValue ?? 0;
        return {
          command: 'SetPercentage',
          value: rangeValue,
          responseProperties: [{
            namespace: 'Alexa.RangeController',
            instance: event.directive.header.instance,
            name: 'rangeValue',
            value: rangeValue,
            timeOfSample: timestamp,
            uncertaintyInMilliseconds: 500
          } as any]
        };
      }
      if (name === 'AdjustRangeValue') {
        const delta = payload.rangeValueDelta ?? 0;
        return {
          command: 'AdjustPercentage',
          value: delta,
          responseProperties: [{
            namespace: 'Alexa.RangeController',
            instance: event.directive.header.instance,
            name: 'rangeValue',
            value: 50,
            timeOfSample: timestamp,
            uncertaintyInMilliseconds: 3000
          } as any]
        };
      }
      throw new Error(`Unsupported RangeController directive: ${name}`);
    }

    default:
      throw new Error(`Unsupported namespace: ${namespace}`);
  }
}

/**
 * Handle any Alexa Smart Home directive by mapping it to a ThingsBoard command.
 */
export async function handleDirective(event: AlexaRequest): Promise<AlexaResponse> {
  const namespace = event.directive.header.namespace;
  const name = event.directive.header.name;
  const endpointId = event.directive.endpoint?.endpointId;
  const correlationToken = event.directive.header.correlationToken;

  console.log(`Handling ${namespace}/${name} for device ${endpointId}`);

  if (!endpointId) {
    throw new Error('No endpoint ID provided');
  }

  // Map the Alexa directive to a ThingsBoard command
  const mapping = mapDirectiveToCommand(event);

  try {
    const accessToken = extractAccessToken(event);
    const client = new ThingsBoardClient();
    client.setAccessToken(accessToken);

    // Send command to backend - backend handles DP mapping and RPC
    await client.executeAlexaSkillCommand(endpointId, mapping.command, mapping.value);

    console.log(`Successfully executed ${mapping.command}=${JSON.stringify(mapping.value)} on device ${endpointId}`);

    return {
      event: {
        header: {
          namespace: 'Alexa',
          name: 'Response',
          messageId: uuid(),
          correlationToken,
          payloadVersion: '3'
        },
        endpoint: { endpointId },
        payload: {}
      },
      context: {
        properties: mapping.responseProperties
      }
    };
  } catch (error) {
    console.error(`Failed to execute ${namespace}/${name} on device ${endpointId}:`, error);
    throw error;
  }
}
