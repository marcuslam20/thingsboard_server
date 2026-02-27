import { useState, useEffect, useCallback } from 'react';
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
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Tooltip from '@mui/material/Tooltip';
import Link from '@mui/material/Link';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import DataPointDialog from '../DataPointDialog';
import { DataPoint, DpType, DpMode, ValueConstraints } from '@/models/datapoint.model';
import { smartHomeProductApi } from '@/api/smarthome-product.api';
import { tuyaColors } from '@/theme/theme';

interface Props {
  deviceProfileId: string;
}

function getModeLabel(mode: DpMode): string {
  switch (mode) {
    case DpMode.RW: return 'Send and Report';
    case DpMode.RO: return 'Report Only';
    case DpMode.WO: return 'Send Only';
    default: return mode;
  }
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

function getPropertiesDisplay(dp: DataPoint): string {
  if (!dp.constraints) return '';
  if (dp.dpType === DpType.VALUE) {
    const c = dp.constraints as ValueConstraints;
    const parts: string[] = [];
    if (c.min !== undefined && c.max !== undefined) parts.push(`Value Range: ${c.min}-${c.max}`);
    if (c.step !== undefined) parts.push(`Pitch: ${c.step}`);
    if (c.scale !== undefined) parts.push(`Scale: ${c.scale}`);
    if (c.unit) parts.push(`Unit: ${c.unit}`);
    return parts.join(', ');
  }
  if (dp.dpType === DpType.ENUM) {
    const c = dp.constraints as { range?: string[] };
    if (c.range) return `Enum: {${c.range.join(', ')}}`;
  }
  if (dp.dpType === DpType.STRING) {
    const c = dp.constraints as { maxlen?: number };
    if (c.maxlen) return `Max Length: ${c.maxlen}`;
  }
  return '';
}

function DpTable({
  title,
  dataPoints,
  onAdd,
  onEdit,
  onDelete,
}: {
  title: string;
  dataPoints: DataPoint[];
  onAdd: () => void;
  onEdit: (dp: DataPoint) => void;
  onDelete: (dp: DataPoint) => void;
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, color: tuyaColors.textPrimary }}>
            {title}
          </Typography>
          <Tooltip title="Data points define the function properties of the product">
            <HelpOutlineIcon sx={{ fontSize: 16, color: tuyaColors.textHint, cursor: 'pointer' }} />
          </Tooltip>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={onAdd}
          sx={{ height: 28, fontSize: '12px' }}
        >
          Add
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${tuyaColors.border}`, borderRadius: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '8%' }}>DP ID</TableCell>
              <TableCell sx={{ width: '14%' }}>DP Name</TableCell>
              <TableCell sx={{ width: '12%' }}>Identifier</TableCell>
              <TableCell sx={{ width: '14%' }}>Data Transfer Type</TableCell>
              <TableCell sx={{ width: '10%' }}>Data Type</TableCell>
              <TableCell sx={{ width: '28%' }}>Properties</TableCell>
              <TableCell sx={{ width: '14%', textAlign: 'right' }}>Operation</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dataPoints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" sx={{ color: tuyaColors.textHint }}>
                    No data points defined
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              dataPoints.map((dp) => (
                <TableRow key={dp.id.id} hover>
                  <TableCell>{dp.dpId}</TableCell>
                  <TableCell>{dp.name}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {dp.code}
                    </Typography>
                  </TableCell>
                  <TableCell>{getModeLabel(dp.mode)}</TableCell>
                  <TableCell>{getTypeLabel(dp.dpType)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ whiteSpace: 'normal', lineHeight: 1.5 }}>
                      {getPropertiesDisplay(dp)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <Link
                      component="button"
                      variant="body2"
                      onClick={() => onEdit(dp)}
                      sx={{ color: tuyaColors.info, cursor: 'pointer', mr: 1.5, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      Edit
                    </Link>
                    <Link
                      component="button"
                      variant="body2"
                      onClick={() => onDelete(dp)}
                      sx={{ color: tuyaColors.info, cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      Delete
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default function FunctionDefinitionTab({ deviceProfileId }: Props) {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDp, setEditDp] = useState<DataPoint | null>(null);
  const [deleteDp, setDeleteDp] = useState<DataPoint | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const dps = await smartHomeProductApi.getDataPoints(deviceProfileId);
      setDataPoints(dps);
    } catch (err) {
      console.error('Failed to load data points:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceProfileId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const standardDps = dataPoints.filter((dp) => dp.standard);
  const customDps = dataPoints.filter((dp) => !dp.standard);

  const handleAdd = () => {
    setEditDp(null);
    setDialogOpen(true);
  };

  const handleEdit = (dp: DataPoint) => {
    setEditDp(dp);
    setDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDp) return;
    try {
      await smartHomeProductApi.deleteDataPoint(deleteDp.id.id);
      setDeleteDp(null);
      loadData();
    } catch (err) {
      console.error('Failed to delete data point:', err);
    }
  };

  const handleSaved = () => {
    setDialogOpen(false);
    setEditDp(null);
    loadData();
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
      {/* Description */}
      <Typography variant="body2" sx={{ color: tuyaColors.textSecondary, mb: 2.5 }}>
        Standard functions, custom functions (optional) and advanced functions (optional) define product functions.{' '}
        <Link href="#" sx={{ color: tuyaColors.info }}>How to define product functions?</Link>
      </Typography>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        <Box sx={{ px: 3, py: 1.5, bgcolor: '#FAFAFA', borderRadius: 1, border: `1px solid ${tuyaColors.border}` }}>
          <Typography variant="caption" sx={{ color: tuyaColors.textHint }}>Standard functions</Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, mt: 0.25 }}>{standardDps.length}</Typography>
        </Box>
        <Box sx={{ px: 3, py: 1.5, bgcolor: '#FAFAFA', borderRadius: 1, border: `1px solid ${tuyaColors.border}` }}>
          <Typography variant="caption" sx={{ color: tuyaColors.textHint }}>Custom functions</Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, mt: 0.25 }}>{customDps.length}</Typography>
        </Box>
      </Box>

      {/* Standard Functions Table */}
      <DpTable
        title="Product Standard Functions"
        dataPoints={standardDps}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(dp) => setDeleteDp(dp)}
      />

      {/* Custom Functions Table */}
      <DpTable
        title="Product Custom Functions"
        dataPoints={customDps}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(dp) => setDeleteDp(dp)}
      />

      {/* Dialogs */}
      <DataPointDialog
        open={dialogOpen}
        deviceProfileId={deviceProfileId}
        dataPoint={editDp}
        onClose={() => { setDialogOpen(false); setEditDp(null); }}
        onSaved={handleSaved}
      />
      <ConfirmDialog
        open={!!deleteDp}
        title="Delete Data Point"
        content={`Are you sure you want to delete DP "${deleteDp?.name}" (ID: ${deleteDp?.dpId})?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDp(null)}
      />
    </Box>
  );
}
