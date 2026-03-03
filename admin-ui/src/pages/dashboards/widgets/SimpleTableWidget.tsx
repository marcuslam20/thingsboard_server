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
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { Widget } from '@/models/dashboard.model';
import { useWidgetData } from './useWidgetData';

interface SimpleTableWidgetProps {
  widget: Widget;
}

export default function SimpleTableWidget({ widget }: SimpleTableWidgetProps) {
  const { data, loading } = useWidgetData(widget.config?.datasources, widget.config?.timewindow);

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
    <TableContainer sx={{ height: '100%', overflow: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Key</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((entry) => {
            const latest = entry.values?.[0];
            return (
              <TableRow key={entry.key}>
                <TableCell>{entry.label}</TableCell>
                <TableCell>{latest?.value ?? '--'}</TableCell>
                <TableCell>{latest ? new Date(latest.ts).toLocaleTimeString() : '--'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
