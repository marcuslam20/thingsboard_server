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
 * ThingsBoard API Client
 * Handles communication with ThingsBoard backend
 */

import axios, { AxiosInstance } from 'axios';
import { TBDevice, TBDeviceState, TBRpcCommand } from '../types/thingsboard';

export class ThingsBoardClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get all Google-enabled devices for a tenant
   * @param accessToken OAuth2 access token
   */
  async getGoogleDevices(accessToken: string): Promise<TBDevice[]> {
    try {
      const response = await this.client.get('/api/google/devices', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Google devices:', error.message);
      throw new Error(`Failed to fetch devices: ${error.message}`);
    }
  }

  /**
   * Execute a command on a device
   * @param deviceId Device ID
   * @param command RPC command
   * @param accessToken OAuth2 access token
   */
  async executeCommand(
    deviceId: string,
    command: TBRpcCommand,
    accessToken: string
  ): Promise<void> {
    try {
      // Send command via ThingsBoard fulfillment endpoint
      // The backend controller will handle mapping to RPC
      await this.client.post(
        '/api/google/fulfillment',
        {
          requestId: `rpc-${Date.now()}`,
          inputs: [
            {
              intent: 'action.devices.EXECUTE',
              payload: {
                commands: [
                  {
                    devices: [{ id: deviceId }],
                    execution: [
                      {
                        command: command.method,
                        params: command.params,
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (error: any) {
      console.error(`Error executing command on device ${deviceId}:`, error.message);
      throw new Error(`Failed to execute command: ${error.message}`);
    }
  }

  /**
   * Query device state
   * @param deviceId Device ID
   * @param accessToken OAuth2 access token
   */
  async queryDeviceState(deviceId: string, accessToken: string): Promise<TBDeviceState> {
    try {
      const response = await this.client.post(
        '/api/google/fulfillment',
        {
          requestId: `query-${Date.now()}`,
          inputs: [
            {
              intent: 'action.devices.QUERY',
              payload: {
                devices: [{ id: deviceId }],
              },
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const deviceState = response.data.payload.devices[deviceId];
      return {
        online: deviceState.online || false,
        state: deviceState.states || {},
      };
    } catch (error: any) {
      console.error(`Error querying device state for ${deviceId}:`, error.message);
      return {
        online: false,
        state: {},
      };
    }
  }
}
