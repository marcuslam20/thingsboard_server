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

import { getToken } from '@/api/client';

type WsCallback = (data: unknown) => void;

interface WsSubscription {
  cmdId: number;
  callback: WsCallback;
}

interface WsCommand {
  tsSubCmds?: Array<{
    entityType: string;
    entityId: string;
    scope?: string;
    cmdId: number;
    keys?: string;
    startTs?: number;
    timeWindow?: number;
  }>;
  historyCmds?: Array<{
    entityType: string;
    entityId: string;
    keys?: string;
    startTs: number;
    endTs: number;
    cmdId: number;
  }>;
  attrSubCmds?: Array<{
    entityType: string;
    entityId: string;
    scope?: string;
    cmdId: number;
    keys?: string;
  }>;
  unsubscribeCmd?: Array<{
    cmdId: number;
  }>;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private subscriptions = new Map<number, WsSubscription>();
  private cmdIdCounter = 0;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;
  private pendingCommands: WsCommand[] = [];
  private onConnectionStatusChange?: (connected: boolean) => void;

  setConnectionStatusCallback(cb: (connected: boolean) => void) {
    this.onConnectionStatusChange = cb;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;

    const token = getToken();
    if (!token) return;

    this.isConnecting = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws/plugins/telemetry?token=${token}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.onConnectionStatusChange?.(true);

      // Send any pending commands
      for (const cmd of this.pendingCommands) {
        this.sendCommand(cmd);
      }
      this.pendingCommands = [];
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.subscriptionId !== undefined) {
          const sub = this.subscriptions.get(msg.subscriptionId);
          if (sub) {
            sub.callback(msg);
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    this.ws.onclose = () => {
      this.isConnecting = false;
      this.onConnectionStatusChange?.(false);
      this.tryReconnect();
    };

    this.ws.onerror = () => {
      this.isConnecting = false;
    };
  }

  private tryReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
  }

  private sendCommand(cmd: WsCommand): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(cmd));
    } else {
      this.pendingCommands.push(cmd);
      this.connect();
    }
  }

  subscribeTelemetry(
    entityType: string,
    entityId: string,
    keys: string,
    callback: WsCallback,
    timeWindow = 60000,
  ): number {
    const cmdId = ++this.cmdIdCounter;
    this.subscriptions.set(cmdId, { cmdId, callback });

    this.sendCommand({
      tsSubCmds: [{
        entityType,
        entityId,
        scope: 'LATEST_TELEMETRY',
        cmdId,
        keys,
        startTs: Date.now() - timeWindow,
        timeWindow,
      }],
    });

    return cmdId;
  }

  subscribeAttributes(
    entityType: string,
    entityId: string,
    scope: string,
    keys: string,
    callback: WsCallback,
  ): number {
    const cmdId = ++this.cmdIdCounter;
    this.subscriptions.set(cmdId, { cmdId, callback });

    this.sendCommand({
      attrSubCmds: [{
        entityType,
        entityId,
        scope,
        cmdId,
        keys,
      }],
    });

    return cmdId;
  }

  subscribeHistory(
    entityType: string,
    entityId: string,
    keys: string,
    startTs: number,
    endTs: number,
    callback: WsCallback,
  ): number {
    const cmdId = ++this.cmdIdCounter;
    this.subscriptions.set(cmdId, { cmdId, callback });

    this.sendCommand({
      historyCmds: [{
        entityType,
        entityId,
        keys,
        startTs,
        endTs,
        cmdId,
      }],
    });

    return cmdId;
  }

  unsubscribe(cmdId: number): void {
    this.subscriptions.delete(cmdId);
    this.sendCommand({
      unsubscribeCmd: [{ cmdId }],
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.subscriptions.clear();
    this.pendingCommands = [];
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();
