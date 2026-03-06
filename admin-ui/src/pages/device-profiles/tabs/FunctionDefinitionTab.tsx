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
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Tooltip from '@mui/material/Tooltip';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import DataPointDialog from '../DataPointDialog';
import AddStandardFunctionDialog from '../AddStandardFunctionDialog';
import { DataPoint, DpType, DpMode, ValueConstraints } from '@/models/datapoint.model';
import { smartHomeProductApi } from '@/api/smarthome-product.api';
import { tuyaColors } from '@/theme/theme';

interface Props {
  deviceProfileId: string;
  categoryId?: string;
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
  addLabel,
  onEdit,
  onDelete,
  loading: tableLoading,
  requiredCodes,
}: {
  title: string;
  dataPoints: DataPoint[];
  onAdd: () => void;
  addLabel?: string;
  onEdit: (dp: DataPoint) => void;
  onDelete: (dp: DataPoint) => void;
  loading?: boolean;
  requiredCodes?: Set<string>;
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
          startIcon={tableLoading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <AddIcon />}
          onClick={onAdd}
          disabled={tableLoading}
          sx={{ height: 28, fontSize: '12px' }}
        >
          {addLabel || '+ Add'}
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${tuyaColors.border}`, borderRadius: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '6%' }}>DP ID</TableCell>
              <TableCell sx={{ width: '14%' }}>DP Name</TableCell>
              <TableCell sx={{ width: '10%' }}>Identifier</TableCell>
              <TableCell sx={{ width: '12%' }}>Data Transfer Type</TableCell>
              <TableCell sx={{ width: '8%' }}>Data Type</TableCell>
              <TableCell sx={{ width: '20%' }}>Properties</TableCell>
              <TableCell sx={{ width: '10%' }}>Report frequency limit</TableCell>
              <TableCell sx={{ width: '8%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Remarks
                  <AutoAwesomeIcon sx={{ fontSize: 14, color: tuyaColors.info }} />
                </Box>
              </TableCell>
              <TableCell sx={{ width: '12%', textAlign: 'right' }}>Operation</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dataPoints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" sx={{ color: tuyaColors.textHint }}>
                    No data points defined
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              dataPoints.map((dp) => {
                const isRequired = requiredCodes?.has(dp.code);
                const canDelete = !isRequired;
                return (
                  <TableRow key={dp.id.id} hover>
                    <TableCell>{dp.dpId}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        {dp.name}
                        {isRequired && (
                          <Chip
                            label="Required"
                            size="small"
                            sx={{
                              height: 20, fontSize: '11px', fontWeight: 500,
                              bgcolor: 'rgba(82,196,26,0.1)',
                              color: tuyaColors.success,
                              border: `1px solid rgba(82,196,26,0.3)`,
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
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
                    <TableCell>
                      <Typography variant="body2" sx={{ color: tuyaColors.textHint }}>—</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: tuyaColors.textHint }}>—</Typography>
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
                      {canDelete && (
                        <Link
                          component="button"
                          variant="body2"
                          onClick={() => onDelete(dp)}
                          sx={{ color: tuyaColors.info, cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          Delete
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function SummaryCard({ label, count, suffix, linkText, highlighted }: {
  label: string;
  count: number;
  suffix?: string;
  linkText?: string;
  highlighted?: boolean;
}) {
  return (
    <Box sx={{
      px: 3, py: 1.5, bgcolor: '#FAFAFA', borderRadius: 1,
      border: `1px solid ${tuyaColors.border}`, minWidth: 140,
    }}>
      <Typography variant="caption" sx={{ color: tuyaColors.textHint }}>{label}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mt: 0.25 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>{count}</Typography>
        {suffix && (
          <Typography variant="caption" sx={{ color: tuyaColors.textHint }}>{suffix}</Typography>
        )}
        {linkText && (
          <Link
            href="#"
            sx={{ fontSize: '12px', color: tuyaColors.info, ml: 0.5, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {linkText}
          </Link>
        )}
        {highlighted && (
          <Box sx={{
            ml: 0.5, px: 0.5, py: 0, bgcolor: tuyaColors.info, color: '#fff',
            borderRadius: '4px', fontSize: '10px', lineHeight: '16px', fontWeight: 600,
          }}>
            AI
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function FunctionDefinitionTab({ deviceProfileId, categoryId }: Props) {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addStandardOpen, setAddStandardOpen] = useState(false);
  const [editDp, setEditDp] = useState<DataPoint | null>(null);
  const [deleteDp, setDeleteDp] = useState<DataPoint | null>(null);
  const [activeSubTab, setActiveSubTab] = useState(0);
  const [requiredCodes, setRequiredCodes] = useState<Set<string>>(new Set());

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

  // Load required codes from category's standardDpSet
  useEffect(() => {
    if (!categoryId) return;
    smartHomeProductApi.getCategory(categoryId)
      .then((cat) => {
        if (cat.standardDpSet && Array.isArray(cat.standardDpSet)) {
          const codes = new Set<string>();
          for (const dp of cat.standardDpSet as { code: string; required?: boolean }[]) {
            if (dp.required) codes.add(dp.code);
          }
          setRequiredCodes(codes);
        }
      })
      .catch(() => setRequiredCodes(new Set()));
  }, [categoryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const standardDps = dataPoints.filter((dp) => dp.standard);
  const customDps = dataPoints.filter((dp) => !dp.standard);

  const handleAddStandard = () => {
    setAddStandardOpen(true);
  };

  const handleApplySelected = async (selectedDps: { dpId: number; code: string; name: string; dpType: string; mode: string; required?: boolean; constraints?: unknown }[]) => {
    try {
      await smartHomeProductApi.applyStandardDps(deviceProfileId, selectedDps as Partial<DataPoint>[]);
      loadData();
    } catch (err) {
      console.error('Failed to apply standard DPs:', err);
    }
  };

  const handleAddCustom = () => {
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

      {/* Summary Cards + Action Buttons */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <SummaryCard label="Standard functions" count={standardDps.length} />
          <SummaryCard label="Custom functions" count={customDps.length} />
          <SummaryCard label="Advanced functions" count={0} suffix="/6" linkText="View" />
          <SummaryCard label="AI functions" count={0} linkText="View" highlighted />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DescriptionOutlinedIcon sx={{ fontSize: 16 }} />}
            sx={{
              height: 32, fontSize: '12px', color: tuyaColors.textSecondary,
              borderColor: tuyaColors.border, '&:hover': { borderColor: tuyaColors.info },
            }}
          >
            Generate Product Card
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />}
            sx={{
              height: 32, fontSize: '12px', color: tuyaColors.textSecondary,
              borderColor: tuyaColors.border, '&:hover': { borderColor: tuyaColors.info },
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Sub-tabs: Product functions | Product AI Capabilities */}
      <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${tuyaColors.border}`, mb: 2.5 }}>
        <Box
          onClick={() => setActiveSubTab(0)}
          sx={{
            px: 2, py: 1, cursor: 'pointer', fontSize: '13px', fontWeight: 500,
            color: activeSubTab === 0 ? tuyaColors.info : tuyaColors.textSecondary,
            borderBottom: activeSubTab === 0 ? `2px solid ${tuyaColors.info}` : '2px solid transparent',
            mb: '-1px',
          }}
        >
          Product functions
        </Box>
        <Box
          onClick={() => setActiveSubTab(1)}
          sx={{
            px: 2, py: 1, cursor: 'pointer', fontSize: '13px', fontWeight: 500,
            color: activeSubTab === 1 ? tuyaColors.info : tuyaColors.textSecondary,
            borderBottom: activeSubTab === 1 ? `2px solid ${tuyaColors.info}` : '2px solid transparent',
            mb: '-1px', display: 'flex', alignItems: 'center', gap: 0.5,
          }}
        >
          Product AI Capabilities
          <Box sx={{
            px: 0.5, py: 0, bgcolor: tuyaColors.error, color: '#fff',
            borderRadius: '4px', fontSize: '10px', lineHeight: '16px', fontWeight: 600,
          }}>
            New
          </Box>
        </Box>
      </Box>

      {/* Tab Content */}
      {activeSubTab === 0 ? (
        <>
          {/* Standard Functions Table */}
          <DpTable
            title="Product Standard Functions"
            dataPoints={standardDps}
            onAdd={handleAddStandard}
            addLabel="+ Add"
            onEdit={handleEdit}
            onDelete={(dp) => setDeleteDp(dp)}
            requiredCodes={requiredCodes}
          />

          {/* Custom Functions Table */}
          <DpTable
            title="Product Custom Functions"
            dataPoints={customDps}
            onAdd={handleAddCustom}
            onEdit={handleEdit}
            onDelete={(dp) => setDeleteDp(dp)}
          />
        </>
      ) : (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <AutoAwesomeIcon sx={{ fontSize: 48, color: tuyaColors.textHint, mb: 1 }} />
          <Typography variant="body2" sx={{ color: tuyaColors.textHint }}>
            AI Capabilities coming soon
          </Typography>
        </Box>
      )}

      {/* Next Step Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          sx={{ px: 4, height: 40 }}
        >
          Next Step: Device Interaction
        </Button>
      </Box>

      {/* Dialogs */}
      <AddStandardFunctionDialog
        open={addStandardOpen}
        categoryId={categoryId}
        existingDpCodes={dataPoints.map((dp) => dp.code)}
        onClose={() => setAddStandardOpen(false)}
        onApply={handleApplySelected}
      />
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
