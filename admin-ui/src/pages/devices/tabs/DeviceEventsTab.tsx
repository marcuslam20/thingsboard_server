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
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '@/api/client';

interface Props {
  deviceId: string;
}

interface EventData {
  id: { id: string };
  createdTime: number;
  type: string;
  body: Record<string, unknown>;
}

const EVENT_TYPES = [
  { value: 'ERROR', label: 'Error' },
  { value: 'LC_EVENT', label: 'Lifecycle' },
  { value: 'STATS', label: 'Statistics' },
  { value: 'DEBUG_RULE_NODE', label: 'Debug' },
];

export default function DeviceEventsTab({ deviceId }: Props) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [eventType, setEventType] = useState('ERROR');
  const [loading, setLoading] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/events/DEVICE/${deviceId}/${eventType}`, {
        params: {
          pageSize: String(pageSize),
          page: String(page),
          sortProperty: 'createdTime',
          sortOrder: 'DESC',
        },
      });
      setEvents(res.data.data || []);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceId, eventType, page, pageSize]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Event type</InputLabel>
          <Select value={eventType} label="Event type" onChange={(e) => { setEventType(e.target.value); setPage(0); }}>
            {EVENT_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Refresh">
          <IconButton onClick={loadEvents}><RefreshIcon /></IconButton>
        </Tooltip>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, width: 170 }}>Time</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No events</Typography>
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id.id} hover>
                  <TableCell>{new Date(event.createdTime).toLocaleString()}</TableCell>
                  <TableCell sx={{ maxWidth: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Typography variant="body2" component="pre" sx={{ m: 0, fontFamily: 'monospace', fontSize: 12 }}>
                      {JSON.stringify(event.body, null, 2).substring(0, 500)}
                    </Typography>
                  </TableCell>
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
