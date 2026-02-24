import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { Widget } from '@/models/dashboard.model';
import { useWidgetData } from './useWidgetData';

interface StatusWidgetProps {
  widget: Widget;
}

export default function StatusWidget({ widget }: StatusWidgetProps) {
  const { data, loading } = useWidgetData(widget.config?.datasources, widget.config?.timewindow);

  const { label, statusText, color } = useMemo(() => {
    const settings = widget.config?.settings || {};
    const activeValue = (settings.activeValue as string) ?? 'true';
    const activeText = (settings.activeText as string) || 'Online';
    const inactiveText = (settings.inactiveText as string) || 'Offline';
    const activeColor = (settings.activeColor as string) || '#4caf50';
    const inactiveColor = (settings.inactiveColor as string) || '#f44336';

    const entry = data[0];
    const lastValue = entry?.values?.[entry.values.length - 1]?.value;
    const active =
      lastValue !== undefined && String(lastValue) === String(activeValue);

    return {
      label: entry?.label || '',
      statusText: active ? activeText : inactiveText,
      color: active ? activeColor : inactiveColor,
    };
  }, [data, widget.config?.settings]);

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
      {label && (
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      )}
      <Chip
        icon={
          <FiberManualRecordIcon
            sx={{ color: `${color} !important`, fontSize: 14 }}
          />
        }
        label={statusText}
        variant="outlined"
        sx={{
          borderColor: color,
          color,
          fontWeight: 600,
          fontSize: 14,
          py: 2,
          px: 1,
        }}
      />
    </Box>
  );
}
