import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import EntityTable, { ColumnDef, RowAction } from '@/components/entity/EntityTable';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import TenantProfileDialog from './TenantProfileDialog';
import { TenantProfile, tenantProfileApi } from '@/api/tenant-profile.api';
import { PageLink } from '@/models/page.model';
import { useTranslation } from 'react-i18next';

export default function TenantProfilesPage() {
  const { t } = useTranslation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<TenantProfile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<TenantProfile | null>(null);

  const refresh = () => setRefreshTrigger((n) => n + 1);

  const columns: ColumnDef<TenantProfile>[] = [
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
    {
      id: 'isolatedTbRuleEngine', label: 'Isolated Rule Engine', width: '15%',
      render: (r) => <Chip label={r.isolatedTbRuleEngine ? 'Yes' : 'No'} size="small" color={r.isolatedTbRuleEngine ? 'info' : 'default'} variant="outlined" />,
    },
    { id: 'description', label: 'Description', width: '30%', render: (r) => r.description || '' },
  ];

  const rowActions: RowAction<TenantProfile>[] = [
    { icon: <EditIcon fontSize="small" />, tooltip: 'Edit', onClick: (r) => { setEditProfile(r); setDialogOpen(true); } },
    {
      icon: <DeleteIcon fontSize="small" color="error" />, tooltip: 'Delete',
      onClick: (r) => { setToDelete(r); setDeleteDialogOpen(true); },
      hidden: (r) => r.default,
    },
  ];

  const fetchData = useCallback((pl: PageLink) => tenantProfileApi.getTenantProfiles(pl), []);

  const handleSaved = () => { setDialogOpen(false); setEditProfile(null); refresh(); };
  const handleDelete = async () => {
    if (toDelete) { await tenantProfileApi.deleteTenantProfile(toDelete.id.id); setDeleteDialogOpen(false); setToDelete(null); refresh(); }
  };
  const handleDeleteSelected = async (rows: TenantProfile[]) => {
    const deletable = rows.filter((r) => !r.default);
    await Promise.all(deletable.map((r) => tenantProfileApi.deleteTenantProfile(r.id.id))); refresh();
  };

  return (
    <Box>
      <EntityTable<TenantProfile>
        title={t('tenant.tenant-profiles')}
        columns={columns}
        fetchData={fetchData}
        onAdd={() => { setEditProfile(null); setDialogOpen(true); }}
        addLabel="Add Tenant Profile"
        rowActions={rowActions}
        onDeleteSelected={handleDeleteSelected}
        getRowId={(r) => r.id.id}
        refreshTrigger={refreshTrigger}
      />
      <TenantProfileDialog open={dialogOpen} profile={editProfile}
        onClose={() => { setDialogOpen(false); setEditProfile(null); }} onSaved={handleSaved} />
      <ConfirmDialog open={deleteDialogOpen} title="Delete Tenant Profile"
        content={`Are you sure you want to delete tenant profile "${toDelete?.name}"?`}
        onConfirm={handleDelete} onCancel={() => { setDeleteDialogOpen(false); setToDelete(null); }} />
    </Box>
  );
}
