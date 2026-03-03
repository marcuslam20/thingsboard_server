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

const DEFAULT_COLORS = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4'];

interface TimeseriesChartWidgetProps {
  widget: Widget;
}

export default function TimeseriesChartWidget({ widget }: TimeseriesChartWidgetProps) {
  const { data, loading } = useWidgetData(widget.config?.datasources, widget.config?.timewindow);

  const option = useMemo(() => {
    if (data.length === 0) return null;

    const series = data.map((entry, idx) => ({
      name: entry.label,
      type: 'line' as const,
      smooth: true,
      data: [...entry.values]
        .sort((a, b) => a.ts - b.ts)
        .map((v) => [v.ts, Number(v.value) || 0]),
      lineStyle: { width: 2 },
      itemStyle: { color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length] },
    }));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: data.map((e) => e.label),
        bottom: 0,
        type: 'scroll',
      },
      grid: {
        left: 50,
        right: 20,
        top: 20,
        bottom: data.length > 1 ? 40 : 20,
      },
      xAxis: {
        type: 'time',
        axisLabel: { fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10 },
      },
      series,
    };
  }, [data]);

  if (loading && data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!option) {
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
