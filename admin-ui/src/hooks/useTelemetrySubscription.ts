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

import { useState, useEffect, useRef, useCallback } from 'react';
import { wsService } from '@/services/websocket.service';

export interface TelemetryData {
  [key: string]: Array<{ ts: number; value: string }>;
}

interface UseTelemetryOptions {
  entityType: string;
  entityId: string;
  keys: string;
  type?: 'timeseries' | 'attributes';
  scope?: string;
  timeWindow?: number;
  enabled?: boolean;
}

export function useTelemetrySubscription(options: UseTelemetryOptions): {
  data: TelemetryData;
  connected: boolean;
} {
  const { entityType, entityId, keys, type = 'timeseries', scope = 'CLIENT_SCOPE', timeWindow = 60000, enabled = true } = options;
  const [data, setData] = useState<TelemetryData>({});
  const [connected, setConnected] = useState(false);
  const cmdIdRef = useRef<number | null>(null);

  const handleMessage = useCallback((msg: unknown) => {
    const message = msg as { data?: Record<string, Array<[number, string]>> };
    if (!message.data) return;

    setData((prev) => {
      const updated = { ...prev };
      for (const [key, values] of Object.entries(message.data!)) {
        const existing = updated[key] || [];
        const newEntries = values.map(([ts, value]) => ({ ts, value }));
        updated[key] = [...existing, ...newEntries].sort((a, b) => a.ts - b.ts);
        // Keep last 1000 points per key
        if (updated[key].length > 1000) {
          updated[key] = updated[key].slice(-1000);
        }
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    if (!enabled || !entityId || !keys) return;

    wsService.connect();
    wsService.setConnectionStatusCallback(setConnected);

    if (type === 'attributes') {
      cmdIdRef.current = wsService.subscribeAttributes(entityType, entityId, scope, keys, handleMessage);
    } else {
      cmdIdRef.current = wsService.subscribeTelemetry(entityType, entityId, keys, handleMessage, timeWindow);
    }

    return () => {
      if (cmdIdRef.current !== null) {
        wsService.unsubscribe(cmdIdRef.current);
        cmdIdRef.current = null;
      }
    };
  }, [entityType, entityId, keys, type, scope, timeWindow, enabled, handleMessage]);

  return { data, connected };
}
