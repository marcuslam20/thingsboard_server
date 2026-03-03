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
import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import ReactECharts from 'echarts-for-react';
import { Widget } from '@/models/dashboard.model';
import { useWidgetData } from './useWidgetData';

interface GaugeWidgetProps {
  widget: Widget;
}

export default function GaugeWidget({ widget }: GaugeWidgetProps) {
  const { data, loading } = useWidgetData(widget.config?.datasources, widget.config?.timewindow);

  const option = useMemo(() => {
    const settings = widget.config?.settings || {};
    const minValue = (settings.minValue as number) ?? 0;
    const maxValue = (settings.maxValue as number) ?? 100;
    const units = (settings.units as string) || '';

    const entry = data[0];
    const value = entry?.values?.[0]?.value;
    const numValue = value !== undefined ? Number(value) : 0;

    return {
      series: [
        {
          type: 'gauge',
          min: minValue,
          max: maxValue,
          progress: { show: true, width: 14 },
          axisLine: { lineStyle: { width: 14 } },
          axisTick: { show: false },
          splitLine: { length: 10, lineStyle: { width: 2 } },
          axisLabel: { distance: 20, fontSize: 10 },
          anchor: { show: true, size: 16, itemStyle: { borderWidth: 2 } },
          title: { show: true, fontSize: 12, offsetCenter: [0, '70%'] },
          detail: {
            valueAnimation: true,
            fontSize: 20,
            offsetCenter: [0, '50%'],
            formatter: `{value}${units ? ' ' + units : ''}`,
          },
          data: [{ value: numValue, name: entry?.label || '' }],
        },
      ],
    };
  }, [data, widget.config?.settings]);

  if (loading && data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (data.length === 0 && !loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography color="text.secondary">No data</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <ReactECharts option={option} style={{ width: '100%', height: '100%' }} />
    </Box>
  );
}
