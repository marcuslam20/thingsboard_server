import { useState, useEffect, useRef, useCallback } from 'react';
import { Datasource, Timewindow } from '@/models/dashboard.model';
import { dashboardApi } from '@/api/dashboard.api';
import { wsService } from '@/services/websocket.service';

export interface WidgetDataEntry {
  key: string;
  label: string;
  values: Array<{ ts: number; value: string }>;
}

interface UseWidgetDataResult {
  data: WidgetDataEntry[];
  loading: boolean;
  error: string | null;
}

function getTimeRange(timewindow?: Timewindow): { startTs: number; endTs: number } {
  const now = Date.now();
  if (timewindow?.history?.fixedTimewindow) {
    return {
      startTs: timewindow.history.fixedTimewindow.startTimeMs,
      endTs: timewindow.history.fixedTimewindow.endTimeMs,
    };
  }
  const ms = timewindow?.realtime?.timewindowMs || timewindow?.history?.timewindowMs || 3600000;
  return { startTs: now - ms, endTs: now };
}

export function useWidgetData(
  datasources?: Datasource[],
  timewindow?: Timewindow,
  pollIntervalMs = 5000,
  useWebSocket = false,
): UseWidgetDataResult {
  const [data, setData] = useState<WidgetDataEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const datasourcesRef = useRef(datasources);
  const timewindowRef = useRef(timewindow);
  const wsSubIds = useRef<number[]>([]);

  datasourcesRef.current = datasources;
  timewindowRef.current = timewindow;

  // WebSocket mode
  useEffect(() => {
    if (!useWebSocket || !datasources || datasources.length === 0) return;

    wsService.connect();
    const dataKeysMap = new Map<string, { label: string }>();

    for (const ds of datasources) {
      if (!ds.dataKeys || ds.dataKeys.length === 0) continue;
      const deviceId = ds.deviceId || ds.entityId;
      if (!deviceId) continue;

      const keys = ds.dataKeys.map((k) => k.name).join(',');
      for (const dk of ds.dataKeys) {
        dataKeysMap.set(dk.name, { label: dk.label || dk.name });
      }

      const keyType = ds.dataKeys[0]?.type;
      const tw = timewindow?.realtime?.timewindowMs || 60000;

      const handleWsMessage = (msg: unknown) => {
        const message = msg as { data?: Record<string, Array<[number, string]>> };
        if (!message.data) return;

        setData((prev) => {
          const updated = [...prev];
          for (const [key, values] of Object.entries(message.data!)) {
            const info = dataKeysMap.get(key);
            const newEntries = values.map(([ts, value]) => ({ ts, value }));
            const existingIdx = updated.findIndex((e) => e.key === key);
            if (existingIdx >= 0) {
              updated[existingIdx] = {
                ...updated[existingIdx],
                values: [...updated[existingIdx].values, ...newEntries].sort((a, b) => a.ts - b.ts).slice(-500),
              };
            } else {
              updated.push({ key, label: info?.label || key, values: newEntries });
            }
          }
          return updated;
        });
        setError(null);
        setLoading(false);
      };

      if (keyType === 'attribute') {
        const cmdId = wsService.subscribeAttributes('DEVICE', deviceId, 'CLIENT_SCOPE', keys, handleWsMessage);
        wsSubIds.current.push(cmdId);
      } else {
        const cmdId = wsService.subscribeTelemetry('DEVICE', deviceId, keys, handleWsMessage, tw);
        wsSubIds.current.push(cmdId);
      }
    }

    setLoading(true);

    return () => {
      for (const cmdId of wsSubIds.current) {
        wsService.unsubscribe(cmdId);
      }
      wsSubIds.current = [];
    };
  }, [useWebSocket, datasources, timewindow]);

  // Polling mode (fallback)
  const fetchData = useCallback(async () => {
    const ds = datasourcesRef.current;
    const tw = timewindowRef.current;
    if (!ds || ds.length === 0) return;

    try {
      const allEntries: WidgetDataEntry[] = [];

      for (const d of ds) {
        if (!d.dataKeys || d.dataKeys.length === 0) continue;

        const deviceId = d.deviceId || d.entityId;
        if (!deviceId) continue;

        const keys = d.dataKeys.map((k) => k.name).join(',');
        const keyType = d.dataKeys[0]?.type;

        if (keyType === 'timeseries' || keyType === undefined) {
          const { startTs, endTs } = getTimeRange(tw);
          const tsData = await dashboardApi.getDeviceTimeseries(deviceId, keys, startTs, endTs);

          for (const dk of d.dataKeys) {
            allEntries.push({
              key: dk.name,
              label: dk.label || dk.name,
              values: tsData[dk.name] || [],
            });
          }
        } else if (keyType === 'attribute') {
          const attrs = await dashboardApi.getDeviceAttributes(deviceId, 'CLIENT_SCOPE', keys);
          for (const dk of d.dataKeys) {
            const attr = attrs.find((a) => a.key === dk.name);
            allEntries.push({
              key: dk.name,
              label: dk.label || dk.name,
              values: attr ? [{ ts: attr.lastUpdateTs, value: String(attr.value) }] : [],
            });
          }
        }
      }

      setData(allEntries);
      setError(null);
    } catch (err) {
      console.error('Widget data fetch error:', err);
      setError('Failed to fetch data');
    }
  }, []);

  useEffect(() => {
    if (useWebSocket) return; // Skip polling if using WebSocket

    setLoading(true);
    fetchData().finally(() => setLoading(false));

    if (pollIntervalMs > 0) {
      intervalRef.current = setInterval(fetchData, pollIntervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [fetchData, pollIntervalMs, useWebSocket]);

  return { data, loading, error };
}
