import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import EntityTable, { ColumnDef, RowAction } from '@/components/entity/EntityTable';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import DeviceProfileDialog from './DeviceProfileDialog';
import { DeviceProfile } from '@/models/device.model';
import { deviceProfileApi } from '@/api/device-profile.api';
import { PageLink } from '@/models/page.model';
import { useTranslation } from 'react-i18next';

export default function DeviceProfilesPage() {
  const { t } = useTranslation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<DeviceProfile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<DeviceProfile | null>(null);

  const refresh = () => setRefreshTrigger((n) => n + 1);

  const columns: ColumnDef<DeviceProfile>[] = [
    { id: 'createdTime', label: t('common.created-time'), width: '170px', render: (r) => new Date(r.createdTime).toLocaleString() },
    {
      id: 'name', label: 'Name', width: '25%',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {r.name}
          {r.default && <StarIcon fontSize="small" color="warning" />}
        </Box>
      ),
    },
    { id: 'type', label: 'Type', width: '15%' },
    {
      id: 'transportType', label: 'Transport', width: '15%',
      render: (r) => <Chip label={r.transportType} size="small" variant="outlined" />,
    },
    { id: 'description', label: 'Description', width: '25%', render: (r) => r.description || '' },
  ];

  const rowActions: RowAction<DeviceProfile>[] = [
    { icon: <EditIcon fontSize="small" />, tooltip: 'Edit', onClick: (r) => { setEditProfile(r); setDialogOpen(true); } },
    {
      icon: <DeleteIcon fontSize="small" color="error" />, tooltip: 'Delete',
      onClick: (r) => { setToDelete(r); setDeleteDialogOpen(true); },
      hidden: (r) => r.default,
    },
  ];

  const fetchData = useCallback((pl: PageLink) => deviceProfileApi.getDeviceProfiles(pl), []);

  const handleSaved = () => { setDialogOpen(false); setEditProfile(null); refresh(); };
  const handleDelete = async () => {
    if (toDelete) { await deviceProfileApi.deleteDeviceProfile(toDelete.id.id); setDeleteDialogOpen(false); setToDelete(null); refresh(); }
  };
  const handleDeleteSelected = async (rows: DeviceProfile[]) => {
    const deletable = rows.filter((r) => !r.default);
    await Promise.all(deletable.map((r) => deviceProfileApi.deleteDeviceProfile(r.id.id))); refresh();
  };

  return (
    <Box>
      <EntityTable<DeviceProfile>
        title={t('device-profile.device-profiles')}
        columns={columns}
        fetchData={fetchData}
        onAdd={() => { setEditProfile(null); setDialogOpen(true); }}
        addLabel="Add Device Profile"
        rowActions={rowActions}
        onDeleteSelected={handleDeleteSelected}
        getRowId={(r) => r.id.id}
        refreshTrigger={refreshTrigger}
      />
      <DeviceProfileDialog open={dialogOpen} profile={editProfile}
        onClose={() => { setDialogOpen(false); setEditProfile(null); }} onSaved={handleSaved} />
      <ConfirmDialog open={deleteDialogOpen} title="Delete Device Profile"
        content={`Are you sure you want to delete device profile "${toDelete?.name}"?`}
        onConfirm={handleDelete} onCancel={() => { setDeleteDialogOpen(false); setToDelete(null); }} />
    </Box>
  );
}
