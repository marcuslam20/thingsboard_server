/*
 * Copyright © 2016-2025 The Thingsboard Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { Widget } from '@/models/dashboard.model';
import { useWidgetData } from './useWidgetData';

interface ValueCardWidgetProps {
  widget: Widget;
}

export default function ValueCardWidget({ widget }: ValueCardWidgetProps) {
  const { data, loading } = useWidgetData(widget.config?.datasources, widget.config?.timewindow);

  if (loading && data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  const settings = widget.config?.settings || {};
  const units = (settings.units as string) || '';
  const decimals = (settings.decimals as number) ?? 1;

  const entry = data[0];
  const latestValue = entry?.values?.[0]?.value;
  const displayValue = latestValue !== undefined
    ? (isNaN(Number(latestValue)) ? latestValue : Number(latestValue).toFixed(decimals))
    : '--';

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 0.5,
    }}>
      <Typography
        variant="h3"
        sx={{
          fontWeight: 600,
          color: widget.config?.color || 'text.primary',
          lineHeight: 1.2,
        }}
      >
        {displayValue}{units && <Typography component="span" variant="h5" color="text.secondary"> {units}</Typography>}
      </Typography>
      {entry && (
        <Typography variant="body2" color="text.secondary">
          {entry.label}
        </Typography>
      )}
      {!entry && !loading && (
        <Typography variant="body2" color="text.secondary">
          No datasource configured
        </Typography>
      )}
    </Box>
  );
}
