import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import EntityTable, { ColumnDef, RowAction } from '@/components/entity/EntityTable';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import DeviceDialog from './DeviceDialog';
import DeviceCredentialsDialog from './DeviceCredentialsDialog';
import { DeviceInfo, Device } from '@/models/device.model';
import { deviceApi } from '@/api/device.api';
import { PageLink } from '@/models/page.model';
import { useTranslation } from 'react-i18next';

export default function DevicesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<DeviceInfo | null>(null);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [credentialsDeviceId, setCredentialsDeviceId] = useState('');

  const refresh = () => setRefreshTrigger((n) => n + 1);

  const columns: ColumnDef<DeviceInfo>[] = [
    {
      id: 'createdTime',
      label: t('common.created-time'),
      width: '170px',
      render: (row) => new Date(row.createdTime).toLocaleString(),
    },
    {
      id: 'name',
      label: t('device.name'),
      width: '25%',
    },
    {
      id: 'deviceProfileName',
      label: t('device.profile'),
      width: '20%',
    },
    {
      id: 'label',
      label: t('device.label'),
      width: '20%',
    },
    {
      id: 'active',
      label: 'Status',
      width: '100px',
      sortable: false,
      render: (row) => (
        <Chip
          label={row.active ? t('device.active') : t('device.inactive')}
          size="small"
          sx={{
            bgcolor: row.active ? 'rgba(25, 128, 56, 0.08)' : 'rgba(209, 39, 48, 0.08)',
            color: row.active ? '#198038' : '#d12730',
            fontWeight: 500,
          }}
        />
      ),
    },
    {
      id: 'customerTitle',
      label: 'Customer',
      width: '15%',
      render: (row) => row.customerTitle || '',
    },
  ];

  const rowActions: RowAction<DeviceInfo>[] = [
    {
      icon: <VpnKeyIcon fontSize="small" />,
      tooltip: 'Manage credentials',
      onClick: (row) => {
        setCredentialsDeviceId(row.id.id);
        setCredentialsDialogOpen(true);
      },
    },
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit',
      onClick: (row) => {
        deviceApi.getDevice(row.id.id).then((device) => {
          setEditDevice(device);
          setDialogOpen(true);
        });
      },
    },
    {
      icon: <DeleteIcon fontSize="small" color="error" />,
      tooltip: 'Delete',
      onClick: (row) => {
        setDeviceToDelete(row);
        setDeleteDialogOpen(true);
      },
    },
  ];

  const fetchData = useCallback((pl: PageLink) => {
    return deviceApi.getTenantDeviceInfos(pl);
  }, []);

  const handleAdd = () => {
    setEditDevice(null);
    setDialogOpen(true);
  };

  const handleSaved = () => {
    setDialogOpen(false);
    setEditDevice(null);
    refresh();
  };

  const handleDelete = async () => {
    if (deviceToDelete) {
      await deviceApi.deleteDevice(deviceToDelete.id.id);
      setDeleteDialogOpen(false);
      setDeviceToDelete(null);
      refresh();
    }
  };

  const handleDeleteSelected = async (rows: DeviceInfo[]) => {
    await Promise.all(rows.map((r) => deviceApi.deleteDevice(r.id.id)));
    refresh();
  };

  const handleRowClick = (row: DeviceInfo) => {
    navigate(`/entities/devices/${row.id.id}`);
  };

  return (
    <Box>
      <EntityTable<DeviceInfo>
        title={t('device.devices')}
        columns={columns}
        fetchData={fetchData}
        onAdd={handleAdd}
        addLabel={t('device.add')}
        onRowClick={handleRowClick}
        rowActions={rowActions}
        onDeleteSelected={handleDeleteSelected}
        getRowId={(row) => row.id.id}
        refreshTrigger={refreshTrigger}
      />

      <DeviceDialog
        open={dialogOpen}
        device={editDevice}
        onClose={() => { setDialogOpen(false); setEditDevice(null); }}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Device"
        content={`Are you sure you want to delete device "${deviceToDelete?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteDialogOpen(false); setDeviceToDelete(null); }}
      />

      <DeviceCredentialsDialog
        open={credentialsDialogOpen}
        deviceId={credentialsDeviceId}
        onClose={() => setCredentialsDialogOpen(false)}
      />
    </Box>
  );
}
