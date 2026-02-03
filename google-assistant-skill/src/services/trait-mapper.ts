/**
 * Trait Mapper
 * Maps Google Smart Home commands to ThingsBoard RPC commands
 */

import { TBRpcCommand } from '../types/thingsboard';

/**
 * Map Google command to ThingsBoard RPC command
 */
export function mapCommandToRpc(command: string, params: Record<string, any>): TBRpcCommand {
  // Remove prefix if present
  const cleanCommand = command.replace('action.devices.commands.', '');

  const commandMap: Record<string, (params: Record<string, any>) => TBRpcCommand> = {
    OnOff: (p) => ({
      method: 'setPower',
      params: { state: p.on },
    }),
    BrightnessAbsolute: (p) => ({
      method: 'setBrightness',
      params: { brightness: p.brightness },
    }),
    ColorAbsolute: (p) => {
      if (p.color && p.color.spectrumRGB) {
        return {
          method: 'setColor',
          params: { color: p.color.spectrumRGB },
        };
      }
      if (p.color && p.color.spectrumHsv) {
        return {
          method: 'setColorHSV',
          params: {
            hue: p.color.spectrumHsv.hue,
            saturation: p.color.spectrumHsv.saturation,
            value: p.color.spectrumHsv.value,
          },
        };
      }
      if (p.color && p.color.temperature) {
        return {
          method: 'setColorTemperature',
          params: { temperature: p.color.temperature },
        };
      }
      throw new Error('Unsupported color format');
    },
    ThermostatTemperatureSetpoint: (p) => ({
      method: 'setTemperature',
      params: { temperature: p.thermostatTemperatureSetpoint },
    }),
    ThermostatSetMode: (p) => ({
      method: 'setMode',
      params: { mode: p.thermostatMode },
    }),
    SetFanSpeed: (p) => ({
      method: 'setFanSpeed',
      params: { speed: p.fanSpeed },
    }),
    LockUnlock: (p) => ({
      method: 'setLocked',
      params: { locked: p.lock },
    }),
    ActivateScene: (p) => ({
      method: 'activateScene',
      params: { deactivate: p.deactivate || false },
    }),
    OpenClose: (p) => ({
      method: 'setOpenPercent',
      params: { openPercent: p.openPercent },
    }),
    StartStop: (p) => ({
      method: p.start ? 'start' : 'stop',
      params: {},
    }),
    SetVolume: (p) => ({
      method: 'setVolume',
      params: { volumeLevel: p.volumeLevel },
    }),
    VolumeRelative: (p) => ({
      method: 'adjustVolume',
      params: { volumeSteps: p.relativeSteps },
    }),
    SetModes: (p) => ({
      method: 'setMode',
      params: { mode: p.updateModeSettings },
    }),
    SetToggles: (p) => ({
      method: 'setToggle',
      params: { toggles: p.updateToggleSettings },
    }),
  };

  const mapper = commandMap[cleanCommand];
  if (!mapper) {
    throw new Error(`Unknown command: ${command}`);
  }

  return mapper(params);
}

/**
 * Map ThingsBoard state to Google trait state
 */
export function mapStateToTrait(trait: string, state: Record<string, any>): Record<string, any> {
  // Remove prefix if present
  const cleanTrait = trait.replace('action.devices.traits.', '');

  const stateMap: Record<string, (state: Record<string, any>) => Record<string, any>> = {
    OnOff: (s) => ({
      on: s.on || false,
    }),
    Brightness: (s) => ({
      brightness: s.brightness || 0,
    }),
    ColorSetting: (s) => {
      const result: any = {};
      if (s.color !== undefined) {
        result.color = { spectrumRgb: s.color };
      }
      if (s.colorTemperature !== undefined) {
        result.color = result.color || {};
        result.color.temperatureK = s.colorTemperature;
      }
      return result;
    },
    TemperatureSetting: (s) => ({
      thermostatMode: s.mode || 'heat',
      thermostatTemperatureSetpoint: s.temperature || 20,
      thermostatTemperatureAmbient: s.ambientTemperature,
    }),
    FanSpeed: (s) => ({
      currentFanSpeedSetting: s.fanSpeed || 'medium',
    }),
    LockUnlock: (s) => ({
      isLocked: s.locked || false,
    }),
    OpenClose: (s) => ({
      openPercent: s.openPercent || 0,
    }),
    Volume: (s) => ({
      currentVolume: s.volume || 50,
    }),
    Modes: (s) => ({
      currentModeSettings: s.modes || {},
    }),
    Toggles: (s) => ({
      currentToggleSettings: s.toggles || {},
    }),
  };

  const mapper = stateMap[cleanTrait];
  if (!mapper) {
    console.warn(`Unknown trait: ${trait}`);
    return {};
  }

  return mapper(state);
}
