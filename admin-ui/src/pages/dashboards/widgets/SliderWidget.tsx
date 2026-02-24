import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { Widget } from '@/models/dashboard.model';
import { useWidgetData } from './useWidgetData';
import { deviceApi } from '@/api/device.api';

interface SliderWidgetProps {
  widget: Widget;
}

export default function SliderWidget({ widget }: SliderWidgetProps) {
  const { data, loading } = useWidgetData(widget.config?.datasources, widget.config?.timewindow);
  const [value, setValue] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const settings = widget.config?.settings || {};
  const label =
    (settings.sliderLabel as string) || data[0]?.label || 'Value';
  const minValue = (settings.minValue as number) ?? 0;
  const maxValue = (settings.maxValue as number) ?? 100;
  const step = (settings.step as number) || 1;
  const units = (settings.units as string) || '';
  const rpcMethod = (settings.rpcMethod as string) || 'setValue';
  const rpcKey = (settings.rpcKey as string) || data[0]?.key || 'value';
  const deviceId = widget.config?.datasources?.[0]?.deviceId;

  // Sync slider value from telemetry data
  useEffect(() => {
    const entry = data[0];
    if (entry?.values?.length) {
      const num = Number(entry.values[entry.values.length - 1].value);
      if (!isNaN(num)) setValue(num);
    }
  }, [data]);

  // Clean up debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const sendRpc = async (val: number) => {
    if (!deviceId) return;
    setSending(true);
    setError(null);
    try {
      await deviceApi.sendOneWayRpcCommand(deviceId, {
        method: rpcMethod,
        params: { [rpcKey]: val },
      });
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to send command');
    } finally {
      setSending(false);
    }
  };

  const handleChange = (_: Event, newValue: number | number[]) => {
    const val = newValue as number;
    setValue(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      sendRpc(val);
    }, 300);
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
        px: 3,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
        {value}
        {units ? ` ${units}` : ''}
      </Typography>
      <Slider
        value={value}
        onChange={handleChange}
        min={minValue}
        max={maxValue}
        step={step}
        disabled={!deviceId || sending}
        valueLabelDisplay="auto"
        sx={{ width: '100%', maxWidth: 300 }}
      />
      {error && (
        <Alert severity="error" sx={{ fontSize: 11, py: 0, px: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
