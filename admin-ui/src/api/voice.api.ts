import api from './client';

export interface AlexaDeviceConfig {
  id: string;
  name: string;
  type: string;
  label: string;
  alexaCapabilities: {
    enabled: boolean;
    category: string;
    powerState?: boolean;
    brightness?: number;
    temperature?: number;
    temperatureScale?: string;
    thermostatMode?: string;
  };
}

export interface VoiceSolutionState {
  platform: string;
  status: 'no_solution' | 'configuring' | 'released';
  releasedFeatureCount: number;
  category: string;
}

export const voiceApi = {
  /** Get all Alexa-enabled devices */
  getAlexaDevices(): Promise<AlexaDeviceConfig[]> {
    return api.get('/api/alexa/devices').then((r) => r.data);
  },

  /** Configure Alexa capabilities for a single device */
  configureAlexaDevice(deviceId: string, enabled: boolean, category: string): Promise<AlexaDeviceConfig> {
    return api.post(`/api/alexa/devices/${deviceId}/configure`, null, {
      params: { enabled: String(enabled), category },
    }).then((r) => r.data);
  },

  /** Batch enable/disable Alexa for all devices in a profile */
  async configureAlexaForProfile(
    deviceIds: string[],
    enabled: boolean,
    category: string
  ): Promise<AlexaDeviceConfig[]> {
    const results: AlexaDeviceConfig[] = [];
    for (const id of deviceIds) {
      const result = await api.post(`/api/alexa/devices/${id}/configure`, null, {
        params: { enabled: String(enabled), category },
      }).then((r) => r.data);
      results.push(result);
    }
    return results;
  },
};
