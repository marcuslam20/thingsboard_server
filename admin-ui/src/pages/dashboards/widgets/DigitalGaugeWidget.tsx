import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { Widget } from '@/models/dashboard.model';
import { useWidgetData } from './useWidgetData';

interface DigitalGaugeWidgetProps {
  widget: Widget;
}

export default function DigitalGaugeWidget({ widget }: DigitalGaugeWidgetProps) {
  const { data, loading } = useWidgetData(widget.config?.datasources, widget.config?.timewindow);

  const { value, label, units, color, percentage } = useMemo(() => {
    const settings = widget.config?.settings || {};
    const minValue = (settings.minValue as number) ?? 0;
    const maxValue = (settings.maxValue as number) ?? 100;
    const u = (settings.units as string) || '';

    const entry = data[0];
    const rawValue = entry?.values?.[entry.values.length - 1]?.value;
    const numValue = rawValue !== undefined ? Number(rawValue) : NaN;
    const displayValue = isNaN(numValue)
      ? '--'
      : numValue.toFixed((settings.decimals as number) ?? 1);
    const pct = isNaN(numValue)
      ? 0
      : Math.min(100, Math.max(0, ((numValue - minValue) / (maxValue - minValue)) * 100));

    let c = (settings.defaultColor as string) || '#305680';
    const thresholds = settings.thresholds as
      | Array<{ value: number; color: string }>
      | undefined;
    if (thresholds && !isNaN(numValue)) {
      for (const t of thresholds) {
        if (numValue >= t.value) c = t.color;
      }
    }

    return {
      value: displayValue,
      label: entry?.label || '',
      units: u,
      color: c,
      percentage: pct,
    };
  }, [data, widget.config?.settings]);

  if (loading && data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  // SVG circle parameters: radius=52, circumference=2*pi*52 = 326.7
  const circumference = 2 * Math.PI * 52;
  const strokeLength = (percentage / 100) * circumference;
  const gapLength = circumference - strokeLength;
  // Offset to start from top (12 o'clock): -90deg = -circumference/4
  const dashOffset = -circumference / 4;

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
      <Box sx={{ position: 'relative', width: 120, height: 120 }}>
        <svg viewBox="0 0 120 120" width="120" height="120">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${strokeLength} ${gapLength}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>
            {value}
          </Typography>
          {units && (
            <Typography variant="caption" color="text.secondary">
              {units}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
