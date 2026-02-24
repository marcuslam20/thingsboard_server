import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { Widget } from '@/models/dashboard.model';
import { useWidgetData } from './useWidgetData';
import { deviceApi } from '@/api/device.api';

interface ToggleWidgetProps {
  widget: Widget;
}

export default function ToggleWidget({ widget }: ToggleWidgetProps) {
  const { data, loading } = useWidgetData(widget.config?.datasources, widget.config?.timewindow);
  const [checked, setChecked] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const settings = widget.config?.settings || {};
  const label =
    (settings.switchLabel as string) || data[0]?.label || 'Toggle';
  const rpcMethod = (settings.rpcMethod as string) || 'setValue';
  const rpcKey = (settings.rpcKey as string) || data[0]?.key || 'value';
  const deviceId = widget.config?.datasources?.[0]?.deviceId;

  // Sync switch state from telemetry data
  useEffect(() => {
    const entry = data[0];
    if (entry?.values?.length) {
      const val = entry.values[entry.values.length - 1].value;
      setChecked(val === 'true' || val === '1' || val === 'on');
    }
  }, [data]);

  const handleToggle = async () => {
    if (!deviceId || sending) return;
    const newValue = !checked;
    setSending(true);
    setError(null);
    try {
      await deviceApi.sendOneWayRpcCommand(deviceId, {
        method: rpcMethod,
        params: { [rpcKey]: newValue },
      });
      setChecked(newValue);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to send command');
    } finally {
      setSending(false);
    }
  };

  if (loading && data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 1,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Switch
        checked={checked}
        onChange={handleToggle}
        disabled={!deviceId || sending}
        color="primary"
        sx={{ transform: 'scale(1.5)' }}
      />
      <Typography
        variant="caption"
        color={checked ? 'success.main' : 'text.secondary'}
      >
        {checked ? 'ON' : 'OFF'}
      </Typography>
      {error && (
        <Alert severity="error" sx={{ fontSize: 11, py: 0, px: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
