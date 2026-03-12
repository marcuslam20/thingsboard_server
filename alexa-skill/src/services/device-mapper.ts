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
 * Device Mapper
 * Maps ThingsBoard devices to Alexa endpoint format.
 * Uses alexaCapabilities.category from backend (auto-discovered from ProductCategory & DataPoints).
 */

import { TBAlexaDevice } from '../types/thingsboard';
import {
  AlexaEndpointConfig,
  AlexaCapability,
  AlexaDisplayCategory
} from '../types/alexa';

/** Fallback: map device type string to Alexa category when backend doesn't provide one */
function mapDeviceCategoryFallback(deviceType: string): AlexaDisplayCategory {
  const typeMap: Record<string, AlexaDisplayCategory> = {
    'light': 'LIGHT',
    'lamp': 'LIGHT',
    'bulb': 'LIGHT',
    'switch': 'SWITCH',
    'plug': 'SMARTPLUG',
    'outlet': 'SMARTPLUG',
    'thermostat': 'THERMOSTAT',
    'temperature': 'TEMPERATURE_SENSOR',
    'temp_sensor': 'TEMPERATURE_SENSOR',
    'contact': 'CONTACT_SENSOR',
    'door': 'CONTACT_SENSOR',
    'window': 'CONTACT_SENSOR',
    'motion': 'MOTION_SENSOR',
    'curtain': 'INTERIOR_BLIND',
    'blind': 'INTERIOR_BLIND',
    'fan': 'FAN',
    'lock': 'SMARTLOCK',
  };

  const lowerType = deviceType.toLowerCase();
  for (const [key, category] of Object.entries(typeMap)) {
    if (lowerType.includes(key)) {
      return category;
    }
  }
  return 'OTHER';
}

/** Resolve Alexa display category: prefer backend, fallback to device type matching */
function resolveCategory(device: TBAlexaDevice): AlexaDisplayCategory {
  const backendCategory = device.alexaCapabilities?.category;
  if (backendCategory) {
    return backendCategory as AlexaDisplayCategory;
  }
  return mapDeviceCategoryFallback(device.type);
}

/**
 * Build Alexa capabilities for a given category.
 * These define what controllers/interfaces the device supports.
 */
function getCapabilitiesForCategory(category: AlexaDisplayCategory): AlexaCapability[] {
  const capabilities: AlexaCapability[] = [
    { type: 'AlexaInterface', interface: 'Alexa', version: '3' }
  ];

  switch (category) {
    case 'LIGHT':
      capabilities.push(
        {
          type: 'AlexaInterface',
          interface: 'Alexa.PowerController',
          version: '3',
          properties: {
            supported: [{ name: 'powerState' }],
            proactivelyReported: false,
            retrievable: true
          }
        },
        {
          type: 'AlexaInterface',
          interface: 'Alexa.BrightnessController',
          version: '3',
          properties: {
            supported: [{ name: 'brightness' }],
            proactivelyReported: false,
            retrievable: true
          }
        },
        {
          type: 'AlexaInterface',
          interface: 'Alexa.ColorController',
          version: '3',
          properties: {
            supported: [{ name: 'color' }],
            proactivelyReported: false,
            retrievable: true
          }
        },
        {
          type: 'AlexaInterface',
          interface: 'Alexa.ColorTemperatureController',
          version: '3',
          properties: {
            supported: [{ name: 'colorTemperatureInKelvin' }],
            proactivelyReported: false,
            retrievable: true
          }
        }
      );
      break;

    case 'SWITCH':
    case 'SMARTPLUG':
      capabilities.push({
        type: 'AlexaInterface',
        interface: 'Alexa.PowerController',
        version: '3',
        properties: {
          supported: [{ name: 'powerState' }],
          proactivelyReported: false,
          retrievable: true
        }
      });
      break;

    case 'INTERIOR_BLIND':
      capabilities.push(
        {
          type: 'AlexaInterface',
          interface: 'Alexa.PowerController',
          version: '3',
          properties: {
            supported: [{ name: 'powerState' }],
            proactivelyReported: false,
            retrievable: true
          }
        },
        {
          type: 'AlexaInterface',
          interface: 'Alexa.PercentageController',
          version: '3',
          properties: {
            supported: [{ name: 'percentage' }],
            proactivelyReported: false,
            retrievable: true
          }
        }
      );
      break;

    case 'FAN':
      capabilities.push(
        {
          type: 'AlexaInterface',
          interface: 'Alexa.PowerController',
          version: '3',
          properties: {
            supported: [{ name: 'powerState' }],
            proactivelyReported: false,
            retrievable: true
          }
        },
        {
          type: 'AlexaInterface',
          interface: 'Alexa.PercentageController',
          version: '3',
          properties: {
            supported: [{ name: 'percentage' }],
            proactivelyReported: false,
            retrievable: true
          }
        }
      );
      break;

    case 'SMARTLOCK':
      capabilities.push({
        type: 'AlexaInterface',
        interface: 'Alexa.LockController',
        version: '3',
        properties: {
          supported: [{ name: 'lockState' }],
          proactivelyReported: false,
          retrievable: true
        }
      });
      break;

    case 'THERMOSTAT':
      capabilities.push(
        {
          type: 'AlexaInterface',
          interface: 'Alexa.ThermostatController',
          version: '3',
          properties: {
            supported: [
              { name: 'targetSetpoint' },
              { name: 'thermostatMode' }
            ],
            proactivelyReported: false,
            retrievable: true
          },
          configuration: {
            supportedModes: ['HEAT', 'COOL', 'AUTO', 'OFF'],
            supportsScheduling: false
          }
        },
        {
          type: 'AlexaInterface',
          interface: 'Alexa.TemperatureSensor',
          version: '3',
          properties: {
            supported: [{ name: 'temperature' }],
            proactivelyReported: false,
            retrievable: true
          }
        }
      );
      break;

    case 'TEMPERATURE_SENSOR':
      capabilities.push({
        type: 'AlexaInterface',
        interface: 'Alexa.TemperatureSensor',
        version: '3',
        properties: {
          supported: [{ name: 'temperature' }],
          proactivelyReported: false,
          retrievable: true
        }
      });
      break;

    case 'CONTACT_SENSOR':
      capabilities.push({
        type: 'AlexaInterface',
        interface: 'Alexa.ContactSensor',
        version: '3',
        properties: {
          supported: [{ name: 'detectionState' }],
          proactivelyReported: false,
          retrievable: true
        }
      });
      break;

    case 'MOTION_SENSOR':
      capabilities.push({
        type: 'AlexaInterface',
        interface: 'Alexa.MotionSensor',
        version: '3',
        properties: {
          supported: [{ name: 'detectionState' }],
          proactivelyReported: false,
          retrievable: true
        }
      });
      break;
  }

  // All devices get EndpointHealth
  capabilities.push({
    type: 'AlexaInterface',
    interface: 'Alexa.EndpointHealth',
    version: '3',
    properties: {
      supported: [{ name: 'connectivity' }],
      proactivelyReported: false,
      retrievable: true
    }
  });

  return capabilities;
}

/**
 * Map ThingsBoard device to Alexa endpoint configuration
 */
export function mapDeviceToEndpoint(device: TBAlexaDevice): AlexaEndpointConfig {
  const category = resolveCategory(device);

  return {
    endpointId: device.id,
    manufacturerName: 'ThingsBoard',
    friendlyName: device.label || device.name,
    description: `${device.type} - ${device.name}`,
    displayCategories: [category],
    capabilities: getCapabilitiesForCategory(category),
    cookie: {
      deviceType: device.type,
      deviceName: device.name
    }
  };
}

/**
 * Map multiple devices to Alexa endpoints (only enabled devices)
 */
export function mapDevicesToEndpoints(devices: TBAlexaDevice[]): AlexaEndpointConfig[] {
  return devices
    .filter(d => d.alexaCapabilities?.enabled)
    .map(mapDeviceToEndpoint);
}
