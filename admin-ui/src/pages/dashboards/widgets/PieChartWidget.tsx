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

interface PieChartWidgetProps {
  widget: Widget;
}

export default function PieChartWidget({ widget }: PieChartWidgetProps) {
  const { data, loading } = useWidgetData(widget.config?.datasources, widget.config?.timewindow);

  const option = useMemo(() => {
    const settings = widget.config?.settings || {};
    const showLabels = (settings.showLabels as boolean) !== false;
    const showLegend = (settings.showLegend as boolean) !== false;
    const roseType = (settings.roseType as string) || '';

    const pieData = data.map((entry) => {
      const lastValue = entry.values[entry.values.length - 1];
      return {
        name: entry.label,
        value: lastValue ? Number(lastValue.value) || 0 : 0,
      };
    });

    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: showLegend
        ? { orient: 'vertical' as const, right: 10, top: 'center' }
        : undefined,
      series: [
        {
          type: 'pie',
          radius: roseType ? ['20%', '70%'] : ['40%', '70%'],
          roseType: roseType || undefined,
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: showLabels, formatter: '{b}\n{d}%' },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' },
          },
          data: pieData,
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

  if (data.length === 0) {
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
