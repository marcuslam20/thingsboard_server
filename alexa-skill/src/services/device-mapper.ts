/**
 * Device Mapper
 * Maps ThingsBoard devices to Alexa endpoint format
 */

import { TBAlexaDevice } from '../types/thingsboard';
import {
  AlexaEndpointConfig,
  AlexaCapability,
  AlexaDisplayCategory
} from '../types/alexa';

/**
 * Map device type to Alexa display category
 */
export function mapDeviceCategory(deviceType: string): AlexaDisplayCategory {
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
    'motion': 'MOTION_SENSOR'
  };

  const lowerType = deviceType.toLowerCase();
  
  for (const [key, category] of Object.entries(typeMap)) {
    if (lowerType.includes(key)) {
      return category;
    }
  }

  return 'OTHER';
}

/**
 * Get Alexa capabilities based on device category
 */
export function getCapabilitiesForCategory(category: AlexaDisplayCategory): AlexaCapability[] {
  const capabilities: AlexaCapability[] = [
    // All devices support Alexa interface
    {
      type: 'AlexaInterface',
      interface: 'Alexa',
      version: '3'
    }
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

  // Add endpoint health for all devices
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
  const category = mapDeviceCategory(device.type);
  
  return {
    endpointId: device.id,
    manufacturerName: 'PachiraMining',
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
 * Map multiple devices to Alexa endpoints
 */
export function mapDevicesToEndpoints(devices: TBAlexaDevice[]): AlexaEndpointConfig[] {
  return devices
    .filter(d => d.alexaCapabilities?.enabled)
    .map(mapDeviceToEndpoint);
}
