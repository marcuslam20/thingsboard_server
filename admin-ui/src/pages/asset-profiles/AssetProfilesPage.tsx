import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import EntityTable, { ColumnDef, RowAction } from '@/components/entity/EntityTable';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import AssetProfileDialog from './AssetProfileDialog';
import { AssetProfile, assetProfileApi } from '@/api/asset-profile.api';
import { PageLink } from '@/models/page.model';
import { useTranslation } from 'react-i18next';

export default function AssetProfilesPage() {
  const { t } = useTranslation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<AssetProfile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AssetProfile | null>(null);

  const refresh = () => setRefreshTrigger((n) => n + 1);

  const columns: ColumnDef<AssetProfile>[] = [
    { id: 'createdTime', label: t('common.created-time'), width: '170px', render: (r) => new Date(r.createdTime).toLocaleString() },
    {
      id: 'name', label: t('common.name'), width: '30%',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {r.name}
          {r.default && <StarIcon fontSize="small" color="warning" />}
        </Box>
      ),
    },
    { id: 'description', label: t('common.description'), width: '35%', render: (r) => r.description || '' },
  ];

  const rowActions: RowAction<AssetProfile>[] = [
    { icon: <EditIcon fontSize="small" />, tooltip: t('action.edit'), onClick: (r) => { setEditProfile(r); setDialogOpen(true); } },
    {
      icon: <DeleteIcon fontSize="small" color="error" />, tooltip: t('action.delete'),
      onClick: (r) => { setToDelete(r); setDeleteDialogOpen(true); },
      hidden: (r) => r.default,
    },
  ];

  const fetchData = useCallback((pl: PageLink) => assetProfileApi.getAssetProfiles(pl), []);

  const handleSaved = () => { setDialogOpen(false); setEditProfile(null); refresh(); };
  const handleDelete = async () => {
    if (toDelete) { await assetProfileApi.deleteAssetProfile(toDelete.id.id); setDeleteDialogOpen(false); setToDelete(null); refresh(); }
  };
  const handleDeleteSelected = async (rows: AssetProfile[]) => {
    const deletable = rows.filter((r) => !r.default);
    await Promise.all(deletable.map((r) => assetProfileApi.deleteAssetProfile(r.id.id))); refresh();
  };

  return (
    <Box>
      <EntityTable<AssetProfile>
        title={t('asset.asset-profiles')}
        columns={columns}
        fetchData={fetchData}
        onAdd={() => { setEditProfile(null); setDialogOpen(true); }}
        addLabel={t('asset-profile.add')}
        rowActions={rowActions}
        onDeleteSelected={handleDeleteSelected}
        getRowId={(r) => r.id.id}
        refreshTrigger={refreshTrigger}
      />
      <AssetProfileDialog open={dialogOpen} profile={editProfile}
        onClose={() => { setDialogOpen(false); setEditProfile(null); }} onSaved={handleSaved} />
      <ConfirmDialog open={deleteDialogOpen} title={t('asset-profile.delete-title')}
        content={t('asset-profile.delete-confirm', { name: toDelete?.name })}
        onConfirm={handleDelete} onCancel={() => { setDeleteDialogOpen(false); setToDelete(null); }} />
    </Box>
  );
}
