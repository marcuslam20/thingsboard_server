import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '@/api/client';

interface Props {
  deviceId: string;
}

interface Alarm {
  id: { id: string };
  createdTime: number;
  type: string;
  severity: string;
  status: string;
  startTs: number;
  endTs: number;
}

const severityColors: Record<string, string> = {
  CRITICAL: '#d32f2f',
  MAJOR: '#f57c00',
  MINOR: '#fbc02d',
  WARNING: '#7cb342',
  INDETERMINATE: '#9e9e9e',
};

export default function DeviceAlarmsTab({ deviceId }: Props) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const loadAlarms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/alarm/DEVICE/${deviceId}`, {
        params: {
          pageSize: String(pageSize),
          page: String(page),
          sortProperty: 'createdTime',
          sortOrder: 'DESC',
        },
      });
      setAlarms(res.data.data || []);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      console.error('Failed to load alarms:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceId, page, pageSize]);

  useEffect(() => {
    loadAlarms();
  }, [loadAlarms]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 600 }}>
          Alarms
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={loadAlarms}><RefreshIcon /></IconButton>
        </Tooltip>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, width: 170 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 120 }}>Severity</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 150 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : alarms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No alarms</Typography>
                </TableCell>
              </TableRow>
            ) : (
              alarms.map((alarm) => (
                <TableRow key={alarm.id.id} hover>
                  <TableCell>{new Date(alarm.createdTime).toLocaleString()}</TableCell>
                  <TableCell>{alarm.type}</TableCell>
                  <TableCell>
                    <Chip
                      label={alarm.severity}
                      size="small"
                      sx={{ bgcolor: `${severityColors[alarm.severity] || '#9e9e9e'}20`, color: severityColors[alarm.severity] || '#9e9e9e', fontWeight: 500 }}
                    />
                  </TableCell>
                  <TableCell>{alarm.status}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalElements}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 20]}
      />
    </Box>
  );
}
