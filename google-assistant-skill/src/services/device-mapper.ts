/**
 * Device Mapper
 * Maps ThingsBoard devices to Google Smart Home device format
 */

import { TBDevice } from '../types/thingsboard';
import { SyncDevice } from '../types/google-home';

/**
 * Map ThingsBoard devices to Google Smart Home SYNC format
 */
export function mapDevicesToGoogleDevices(tbDevices: TBDevice[]): SyncDevice[] {
  return tbDevices.map((device) => mapDeviceToGoogleDevice(device));
}

/**
 * Map a single ThingsBoard device to Google Smart Home format
 */
export function mapDeviceToGoogleDevice(device: TBDevice): SyncDevice {
  const capabilities = device.googleCapabilities;

  if (!capabilities) {
    throw new Error(`Device ${device.id} does not have Google capabilities configured`);
  }

  // Ensure traits have the full prefix
  const traits = capabilities.traits.map((trait) =>
    trait.startsWith('action.devices.traits.') ? trait : `action.devices.traits.${trait}`
  );

  // Ensure device type has the full prefix
  const deviceType = capabilities.deviceType.startsWith('action.devices.types.')
    ? capabilities.deviceType
    : `action.devices.types.${capabilities.deviceType}`;

  return {
    id: device.id,
    type: deviceType,
    traits: traits,
    name: {
      defaultNames: [device.name],
      name: device.name,
      nicknames: capabilities.nicknames || [device.label || device.name],
    },
    willReportState: capabilities.willReportState || false,
    roomHint: capabilities.roomHint,
    deviceInfo: {
      manufacturer: 'ThingsBoard',
      model: device.type,
      hwVersion: '1.0',
      swVersion: '1.0',
    },
    attributes: capabilities.attributes || {},
    customData: {
      tbDeviceId: device.id,
      tbDeviceType: device.type,
    },
  };
}

/**
 * Map ThingsBoard device type to Google device type
 */
export function mapDeviceType(tbType: string): string {
  const lowerType = tbType.toLowerCase();
  const typeMap: Record<string, string> = {
    light: 'action.devices.types.LIGHT',
    lamp: 'action.devices.types.LIGHT',
    bulb: 'action.devices.types.LIGHT',
    switch: 'action.devices.types.SWITCH',
    outlet: 'action.devices.types.OUTLET',
    smartplug: 'action.devices.types.OUTLET',
    thermostat: 'action.devices.types.THERMOSTAT',
    hvac: 'action.devices.types.THERMOSTAT',
    fan: 'action.devices.types.FAN',
    lock: 'action.devices.types.LOCK',
    door_lock: 'action.devices.types.LOCK',
  };

  return typeMap[lowerType] || 'action.devices.types.SWITCH';
}
