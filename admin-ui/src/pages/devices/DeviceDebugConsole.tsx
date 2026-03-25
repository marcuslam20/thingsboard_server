import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import Slider from '@mui/material/Slider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from '@mui/material/Link';
import { DataPoint, DpType, DpMode, ValueConstraints, EnumConstraints } from '@/models/datapoint.model';
import { smartHomeProductApi } from '@/api/smarthome-product.api';
import { attributeApi } from '@/api/attribute.api';
import { deviceApi } from '@/api/device.api';
import { tuyaColors } from '@/theme/theme';

interface Props {
  deviceId: string;
  deviceName: string;
  deviceProfileId: string;
  active: boolean;
  onBack: () => void;
}

interface CommandLog {
  timestamp: number;
  dpCode: string;
  value: unknown;
  status: 'success' | 'error' | 'pending';
  response?: string;
}

function getTypeLabel(dpType: DpType): string {
  switch (dpType) {
    case DpType.BOOLEAN: return 'Bool';
    case DpType.VALUE: return 'Value';
    case DpType.ENUM: return 'Enum';
    case DpType.STRING: return 'String';
    case DpType.RAW: return 'Raw';
    case DpType.FAULT: return 'Fault';
    default: return dpType;
  }
}

export default function DeviceDebugConsole({ deviceId, deviceName, deviceProfileId, active, onBack }: Props) {
  const { t } = useTranslation();
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [currentValues, setCurrentValues] = useState<Record<string, unknown>>({});
  const [editValues, setEditValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [sendingDp, setSendingDp] = useState<string | null>(null);
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([]);

  const loadDataPoints = useCallback(async () => {
    setLoading(true);
    try {
      const dps = await smartHomeProductApi.getDataPoints(deviceProfileId);
      setDataPoints(dps);
    } catch {
      setDataPoints([]);
    } finally {
      setLoading(false);
    }
  }, [deviceProfileId]);

  const loadCurrentValues = useCallback(async () => {
    try {
      const attrs = await attributeApi.getEntityAttributes('DEVICE', deviceId, 'CLIENT_SCOPE');
      const values: Record<string, unknown> = {};
      for (const attr of attrs) {
        values[attr.key] = attr.value;
      }
      setCurrentValues(values);
      // Initialize edit values from current
      setEditValues((prev) => {
        const next = { ...prev };
        for (const attr of attrs) {
          if (!(attr.key in next)) {
            next[attr.key] = attr.value;
          }
        }
        return next;
      });
    } catch {
      // Ignore
    }
  }, [deviceId]);

  useEffect(() => {
    loadDataPoints();
    loadCurrentValues();
  }, [loadDataPoints, loadCurrentValues]);

  const handleSend = async (dp: DataPoint) => {
    const value = editValues[dp.code] ?? currentValues[dp.code];
    const logEntry: CommandLog = {
      timestamp: Date.now(),
      dpCode: dp.code,
      value,
      status: 'pending',
    };
    setCommandLogs((prev) => [logEntry, ...prev]);
    setSendingDp(dp.code);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await deviceApi.sendTwoWayRpcCommand(deviceId, {
        method: 'setDpValue',
        params: { dpId: dp.dpId, code: dp.code, value },
      });

      clearTimeout(timeout);

      setCommandLogs((prev) =>
        prev.map((l) =>
          l === logEntry ? { ...l, status: 'success' as const, response: JSON.stringify(response) } : l,
        ),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed';
      setCommandLogs((prev) =>
        prev.map((l) =>
          l === logEntry ? { ...l, status: 'error' as const, response: message } : l,
        ),
      );
    } finally {
      setSendingDp(null);
    }
  };

  const handleRefresh = () => {
    loadCurrentValues();
  };

  const renderControl = (dp: DataPoint) => {
    if (dp.mode === DpMode.RO) {
      return <Typography sx={{ fontSize: '11px', color: tuyaColors.textHint }}>{t('debug.read-only')}</Typography>;
    }

    const value = editValues[dp.code] ?? currentValues[dp.code];

    switch (dp.dpType) {
      case DpType.BOOLEAN:
        return (
          <Switch
            size="small"
            checked={Boolean(value)}
            onChange={(_, checked) => setEditValues((prev) => ({ ...prev, [dp.code]: checked }))}
          />
        );

      case DpType.VALUE: {
        const c = (dp.constraints as ValueConstraints) || {};
        const min = c.min ?? 0;
        const max = c.max ?? 100;
        const step = c.step ?? 1;
        const numValue = typeof value === 'number' ? value : min;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
            <Slider
              size="small"
              min={min}
              max={max}
              step={step}
              value={numValue}
              onChange={(_, v) => setEditValues((prev) => ({ ...prev, [dp.code]: v }))}
              sx={{ flex: 1, color: tuyaColors.info }}
            />
            <TextField
              size="small"
              type="number"
              value={numValue}
              onChange={(e) => setEditValues((prev) => ({ ...prev, [dp.code]: Number(e.target.value) }))}
              inputProps={{ min, max, step }}
              sx={{ width: 70, '& .MuiInputBase-root': { height: 24, fontSize: '11px' } }}
            />
          </Box>
        );
      }

      case DpType.ENUM: {
        const c = (dp.constraints as EnumConstraints) || {};
        const range = c.range || [];
        return (
          <Select
            size="small"
            value={value !== undefined ? String(value) : (range[0] || '')}
            onChange={(e) => setEditValues((prev) => ({ ...prev, [dp.code]: e.target.value }))}
            sx={{ height: 24, fontSize: '11px', minWidth: 100 }}
          >
            {range.map((opt) => (
              <MenuItem key={opt} value={opt} sx={{ fontSize: '11px' }}>{opt}</MenuItem>
            ))}
          </Select>
        );
      }

      case DpType.STRING:
        return (
          <TextField
            size="small"
            value={value !== undefined ? String(value) : ''}
            onChange={(e) => setEditValues((prev) => ({ ...prev, [dp.code]: e.target.value }))}
            sx={{ width: 180, '& .MuiInputBase-root': { height: 24, fontSize: '11px' } }}
          />
        );

      case DpType.RAW:
        return (
          <TextField
            size="small"
            placeholder={t('debug.hex-value')}
            value={value !== undefined ? String(value) : ''}
            onChange={(e) => setEditValues((prev) => ({ ...prev, [dp.code]: e.target.value }))}
            sx={{ width: 180, '& .MuiInputBase-root': { height: 24, fontSize: '11px' } }}
          />
        );

      case DpType.FAULT:
        return (
          <Chip
            label={value !== undefined ? String(value) : t('debug.no-fault')}
            size="small"
            sx={{ fontSize: '10px', height: 20 }}
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={32} sx={{ color: tuyaColors.orange }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
        <Link
          component="button"
          onClick={onBack}
          sx={{
            display: 'flex', alignItems: 'center', gap: 0.5,
            color: tuyaColors.info, fontSize: '13px', textDecoration: 'none', cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 16 }} />
          {t('debug.back')}
        </Link>
        <Typography variant="subtitle1" sx={{ fontWeight: 500, color: tuyaColors.textPrimary }}>
          {deviceName}
        </Typography>
        <Chip
          label={active ? t('debug.online') : t('debug.offline')}
          size="small"
          sx={{
            fontSize: '10px', height: 20,
            bgcolor: active ? 'rgba(82,196,26,0.1)' : 'rgba(0,0,0,0.05)',
            color: active ? tuyaColors.success : tuyaColors.textHint,
          }}
        />
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon sx={{ fontSize: 14 }} />}
          onClick={handleRefresh}
          sx={{ height: 24, fontSize: '11px', color: tuyaColors.textSecondary, borderColor: tuyaColors.border }}
        >
          {t('action.refresh')}
        </Button>
      </Box>

      {/* DP Controls Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${tuyaColors.border}`, borderRadius: 1, mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '6%' }}>{t('debug.dp-id')}</TableCell>
              <TableCell sx={{ width: '12%' }}>{t('debug.dp-name')}</TableCell>
              <TableCell sx={{ width: '10%' }}>{t('debug.code')}</TableCell>
              <TableCell sx={{ width: '8%' }}>{t('debug.type')}</TableCell>
              <TableCell sx={{ width: '14%' }}>{t('debug.current-value')}</TableCell>
              <TableCell sx={{ width: '30%' }}>{t('debug.control')}</TableCell>
              <TableCell sx={{ width: '10%' }}>{t('debug.action')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dataPoints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" sx={{ color: tuyaColors.textHint }}>
                    {t('debug.no-data-points')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              dataPoints.map((dp) => (
                <TableRow key={dp.id.id} hover>
                  <TableCell>{dp.dpId}</TableCell>
                  <TableCell>{dp.name}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '11px' }}>{dp.code}</Typography>
                  </TableCell>
                  <TableCell>{getTypeLabel(dp.dpType)}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '11px', color: tuyaColors.textSecondary }}>
                      {currentValues[dp.code] !== undefined ? String(currentValues[dp.code]) : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>{renderControl(dp)}</TableCell>
                  <TableCell>
                    {dp.mode !== DpMode.RO && dp.dpType !== DpType.FAULT && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleSend(dp)}
                        disabled={sendingDp === dp.code}
                        sx={{ height: 22, fontSize: '10px', minWidth: 50 }}
                      >
                        {sendingDp === dp.code ? <CircularProgress size={12} sx={{ color: '#fff' }} /> : t('debug.send')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Command Log */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 500, color: tuyaColors.textPrimary, mb: 1 }}>
          {t('debug.command-log')}
        </Typography>
        <Paper
          elevation={0}
          sx={{
            border: `1px solid ${tuyaColors.border}`, borderRadius: 1,
            maxHeight: 200, overflow: 'auto', bgcolor: '#FAFAFA',
          }}
        >
          {commandLogs.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: tuyaColors.textHint }}>
                {t('debug.no-commands')}
              </Typography>
            </Box>
          ) : (
            commandLogs.map((log, idx) => (
              <Box
                key={idx}
                sx={{
                  px: 2, py: 0.75,
                  borderBottom: idx < commandLogs.length - 1 ? `1px solid ${tuyaColors.border}` : 'none',
                  display: 'flex', alignItems: 'center', gap: 1.5,
                }}
              >
                <Typography sx={{ fontSize: '10px', color: tuyaColors.textHint, fontFamily: 'monospace', flexShrink: 0 }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Typography>
                <Typography sx={{ fontSize: '11px', fontFamily: 'monospace', color: tuyaColors.info, flexShrink: 0 }}>
                  {log.dpCode}
                </Typography>
                <Typography sx={{ fontSize: '11px', color: tuyaColors.textPrimary }}>
                  = {JSON.stringify(log.value)}
                </Typography>
                <Chip
                  label={log.status}
                  size="small"
                  sx={{
                    fontSize: '9px', height: 16, ml: 'auto',
                    bgcolor: log.status === 'success' ? 'rgba(82,196,26,0.1)' :
                             log.status === 'error' ? 'rgba(255,77,79,0.1)' : 'rgba(0,139,213,0.1)',
                    color: log.status === 'success' ? tuyaColors.success :
                           log.status === 'error' ? tuyaColors.error : tuyaColors.info,
                  }}
                />
                {log.response && (
                  <Typography sx={{ fontSize: '10px', color: tuyaColors.textHint, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.response}
                  </Typography>
                )}
              </Box>
            ))
          )}
        </Paper>
      </Box>
    </Box>
  );
}
