import { useState, useEffect, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import api from '@/api/client';
import { Widget } from '@/models/dashboard.model';

interface Alarm {
  id: { id: string };
  createdTime: number;
  type: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INDETERMINATE';
  status: string;
  originator: { id: string; entityType: string };
  originatorName?: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#d32f2f',
  MAJOR: '#f57c00',
  MINOR: '#fbc02d',
  WARNING: '#1976d2',
  INDETERMINATE: '#757575',
};

interface AlarmTableWidgetProps {
  widget: Widget;
}

export default function AlarmTableWidget({ widget }: AlarmTableWidgetProps) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const settingsRef = useRef(widget.config?.settings);
  settingsRef.current = widget.config?.settings;

  const fetchAlarms = useCallback(async () => {
    try {
      const settings = settingsRef.current || {};
      const pageSize = (settings.pageSize as number) || 10;
      const status = (settings.alarmStatus as string) || '';
      const params: Record<string, string> = {
        pageSize: String(pageSize),
        page: '0',
        sortProperty: 'createdTime',
        sortOrder: 'DESC',
      };
      if (status) params.status = status;

      const res = await api.get('/api/alarms', { params });
      setAlarms(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch alarms:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlarms();
    const interval = setInterval(fetchAlarms, 10000);
    return () => clearInterval(interval);
  }, [fetchAlarms]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (alarms.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography color="text.secondary">No alarms</Typography>
      </Box>
    );
  }

  return (
    <TableContainer sx={{ height: '100%', overflow: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {alarms.map((alarm) => (
            <TableRow key={alarm.id.id}>
              <TableCell sx={{ fontSize: 12 }}>
                {new Date(alarm.createdTime).toLocaleString()}
              </TableCell>
              <TableCell>{alarm.type}</TableCell>
              <TableCell>
                <Chip
                  label={alarm.severity}
                  size="small"
                  sx={{
                    bgcolor: `${SEVERITY_COLORS[alarm.severity] || '#757575'}20`,
                    color: SEVERITY_COLORS[alarm.severity] || '#757575',
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                />
              </TableCell>
              <TableCell sx={{ fontSize: 12 }}>{alarm.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
