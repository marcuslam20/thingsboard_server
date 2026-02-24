import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import { attributeApi, TimeseriesData } from '@/api/attribute.api';

interface Props {
  deviceId: string;
}

interface TelemetryRow {
  key: string;
  value: string;
  ts: number;
}

export default function DeviceTelemetryTab({ deviceId }: Props) {
  const [rows, setRows] = useState<TelemetryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTelemetry = useCallback(async () => {
    setLoading(true);
    try {
      const keys = await attributeApi.getTimeseriesKeys('DEVICE', deviceId);
      if (keys.length === 0) {
        setRows([]);
        return;
      }
      const data: TimeseriesData = await attributeApi.getLatestTimeseries('DEVICE', deviceId, keys.join(','));
      const result: TelemetryRow[] = [];
      for (const key of Object.keys(data)) {
        const entries = data[key];
        if (entries && entries.length > 0) {
          result.push({ key, value: entries[0].value, ts: entries[0].ts });
        }
      }
      result.sort((a, b) => a.key.localeCompare(b.key));
      setRows(result);
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    loadTelemetry();
  }, [loadTelemetry]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 600 }}>
          Latest Telemetry
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={loadTelemetry}><RefreshIcon /></IconButton>
        </Tooltip>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Key</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 180 }}>Last updated</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No telemetry data</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.key} hover>
                  <TableCell>{row.key}</TableCell>
                  <TableCell sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.value}
                  </TableCell>
                  <TableCell>{new Date(row.ts).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
