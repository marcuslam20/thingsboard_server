/**
 * ThingsBoard API Client
 * Handles authentication and API calls to ThingsBoard server
 */

import {
  TBLoginRequest,
  TBLoginResponse,
  TBAlexaDevice,
  TBRpcRequest,
  TBRpcResponse,
  TBTelemetry
} from '../types/thingsboard';

export class ThingsBoardClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private externalToken: boolean = false;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.TB_URL || '';
    if (!this.baseUrl) {
      throw new Error('ThingsBoard URL not configured');
    }
    // Remove trailing slash if present
    this.baseUrl = this.baseUrl.replace(/\/$/, '');
  }

  /**
   * Set an externally-provided access token (e.g., Alexa OAuth2 token).
   * When set, login() and ensureAuthenticated() are bypassed.
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
    this.externalToken = true;
  }

  /**
   * Authenticate with ThingsBoard and get access token
   */
  async login(username?: string, password?: string): Promise<string> {
    const user = username || process.env.TB_USER;
    const pass = password || process.env.TB_PASS;

    if (!user || !pass) {
      throw new Error('ThingsBoard credentials not configured');
    }

    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: user, password: pass } as TBLoginRequest)
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as TBLoginResponse;
    this.accessToken = data.token;
    // Token typically expires in 2.5 hours, refresh at 2 hours
    this.tokenExpiry = Date.now() + 2 * 60 * 60 * 1000;

    return data.token;
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureAuthenticated(): Promise<void> {
    if (this.externalToken) {
      if (!this.accessToken) {
        throw new Error('External access token not set');
      }
      return;
    }
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.login();
    }
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    await this.ensureAuthenticated();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.externalToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    } else {
      headers['X-Authorization'] = `Bearer ${this.accessToken}`;
    }
    // Allow caller to override headers
    if (options.headers) {
      const extra = options.headers as Record<string, string>;
      Object.assign(headers, extra);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} - ${error}`);
    }

    return await response.json() as T;
  }

  /**
   * Get all Alexa-enabled devices
   */
  async getAlexaDevices(): Promise<TBAlexaDevice[]> {
    return this.request<TBAlexaDevice[]>('/api/alexa/devices');
  }

  /**
   * Get specific device by ID
   */
  async getDevice(deviceId: string): Promise<TBAlexaDevice> {
    return this.request<TBAlexaDevice>(`/api/alexa/devices/${deviceId}`);
  }

  /**
   * Send one-way RPC command to device
   */
  async sendRpcCommand(
    deviceId: string,
    method: string,
    params: Record<string, any>
  ): Promise<void> {
    const request: TBRpcRequest = {
      method,
      params,
      timeout: 5000
    };

    await this.request(`/api/rpc/v2/oneway/${deviceId}`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * Send two-way RPC command to device and get response
   */
  async sendRpcCommandTwoWay(
    deviceId: string,
    method: string,
    params: Record<string, any>
  ): Promise<TBRpcResponse> {
    const request: TBRpcRequest = {
      method,
      params,
      timeout: 10000
    };

    return this.request<TBRpcResponse>(`/api/rpc/v2/twoway/${deviceId}`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * Get latest telemetry values for device
   */
  async getLatestTelemetry(deviceId: string, keys: string[]): Promise<TBTelemetry> {
    const keysParam = keys.join(',');
    return this.request<TBTelemetry>(
      `/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${keysParam}`
    );
  }

  /**
   * Execute Alexa command on device
   */
  async executeAlexaCommand(
    deviceId: string,
    command: string,
    value: any
  ): Promise<void> {
    await this.request(`/api/alexa/devices/${deviceId}/command`, {
      method: 'POST',
      body: JSON.stringify({ command, value })
    });
  }

  // ============== Skill endpoints (per-user OAuth2 token auth) ==============

  /**
   * Get all Alexa-enabled devices via skill endpoint (per-user scoped)
   */
  async getAlexaSkillDevices(): Promise<TBAlexaDevice[]> {
    return this.request<TBAlexaDevice[]>('/api/alexa/skill/devices');
  }

  /**
   * Get specific device by ID via skill endpoint
   */
  async getAlexaSkillDevice(deviceId: string): Promise<TBAlexaDevice> {
    return this.request<TBAlexaDevice>(`/api/alexa/skill/devices/${deviceId}`);
  }

  /**
   * Execute Alexa command on device via skill endpoint
   */
  async executeAlexaSkillCommand(
    deviceId: string,
    command: string,
    value: any
  ): Promise<void> {
    await this.request(`/api/alexa/skill/devices/${deviceId}/command`, {
      method: 'POST',
      body: JSON.stringify({ command, value })
    });
  }

  /**
   * Get latest telemetry for a device via skill endpoint
   */
  async getAlexaSkillTelemetry(deviceId: string, keys: string[]): Promise<TBTelemetry> {
    const keysParam = keys.join(',');
    return this.request<TBTelemetry>(
      `/api/alexa/skill/devices/${deviceId}/telemetry?keys=${keysParam}`
    );
  }
}
