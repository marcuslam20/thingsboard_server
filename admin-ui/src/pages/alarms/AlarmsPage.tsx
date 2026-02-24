import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import EntityTable, { ColumnDef, RowAction } from '@/components/entity/EntityTable';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import { AlarmInfo, alarmApi } from '@/api/alarm.api';
import { PageLink } from '@/models/page.model';
import { useTranslation } from 'react-i18next';

const SEVERITY_COLORS: Record<string, 'error' | 'warning' | 'info' | 'success' | 'default'> = {
  CRITICAL: 'error',
  MAJOR: 'warning',
  MINOR: 'info',
  WARNING: 'success',
  INDETERMINATE: 'default',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE_UNACK: 'Active Unack',
  ACTIVE_ACK: 'Active Ack',
  CLEARED_UNACK: 'Cleared Unack',
  CLEARED_ACK: 'Cleared Ack',
};

export default function AlarmsPage() {
  const { t } = useTranslation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AlarmInfo | null>(null);

  const refresh = () => setRefreshTrigger((n) => n + 1);

  const columns: ColumnDef<AlarmInfo>[] = [
    { id: 'createdTime', label: t('common.created-time'), width: '170px', render: (r) => new Date(r.createdTime).toLocaleString() },
    { id: 'originatorName', label: 'Originator', width: '20%', render: (r) => r.originatorName || r.originator?.id || '' },
    { id: 'type', label: 'Type', width: '15%' },
    {
      id: 'severity', label: 'Severity', width: '12%',
      render: (r) => <Chip label={r.severity} size="small" color={SEVERITY_COLORS[r.severity] || 'default'} />,
    },
    {
      id: 'status', label: 'Status', width: '13%',
      render: (r) => STATUS_LABELS[r.status] || r.status,
    },
    { id: 'startTs', label: 'Start Time', width: '170px', render: (r) => r.startTs ? new Date(r.startTs).toLocaleString() : '' },
  ];

  const rowActions: RowAction<AlarmInfo>[] = [
    {
      icon: <CheckCircleIcon fontSize="small" color="success" />,
      tooltip: 'Acknowledge',
      onClick: async (r) => { await alarmApi.ackAlarm(r.id.id); refresh(); },
      hidden: (r) => r.status === 'ACTIVE_ACK' || r.status === 'CLEARED_ACK',
    },
    {
      icon: <ClearIcon fontSize="small" color="info" />,
      tooltip: 'Clear',
      onClick: async (r) => { await alarmApi.clearAlarm(r.id.id); refresh(); },
      hidden: (r) => r.status === 'CLEARED_UNACK' || r.status === 'CLEARED_ACK',
    },
    {
      icon: <DeleteIcon fontSize="small" color="error" />,
      tooltip: 'Delete',
      onClick: (r) => { setToDelete(r); setDeleteDialogOpen(true); },
    },
  ];

  const fetchData = useCallback((pl: PageLink) => alarmApi.getAllAlarms(pl, statusFilter || undefined, severityFilter || undefined),
    [statusFilter, severityFilter]);

  const handleDelete = async () => {
    if (toDelete) { await alarmApi.deleteAlarm(toDelete.id.id); setDeleteDialogOpen(false); setToDelete(null); refresh(); }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          select size="small" label="Severity" value={severityFilter}
          onChange={(e) => { setSeverityFilter(e.target.value); setRefreshTrigger((n) => n + 1); }}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="CRITICAL">Critical</MenuItem>
          <MenuItem value="MAJOR">Major</MenuItem>
          <MenuItem value="MINOR">Minor</MenuItem>
          <MenuItem value="WARNING">Warning</MenuItem>
          <MenuItem value="INDETERMINATE">Indeterminate</MenuItem>
        </TextField>
        <TextField
          select size="small" label="Status" value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setRefreshTrigger((n) => n + 1); }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="ACTIVE_UNACK">Active Unack</MenuItem>
          <MenuItem value="ACTIVE_ACK">Active Ack</MenuItem>
          <MenuItem value="CLEARED_UNACK">Cleared Unack</MenuItem>
          <MenuItem value="CLEARED_ACK">Cleared Ack</MenuItem>
        </TextField>
      </Stack>
      <EntityTable<AlarmInfo>
        title={t('alarm.alarms')}
        columns={columns}
        fetchData={fetchData}
        rowActions={rowActions}
        getRowId={(r) => r.id.id}
        refreshTrigger={refreshTrigger}
      />
      <ConfirmDialog open={deleteDialogOpen} title="Delete Alarm"
        content={`Are you sure you want to delete this alarm?`}
        onConfirm={handleDelete} onCancel={() => { setDeleteDialogOpen(false); setToDelete(null); }} />
    </Box>
  );
}
