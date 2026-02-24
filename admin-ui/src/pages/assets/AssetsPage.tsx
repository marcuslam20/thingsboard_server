import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EntityTable, { ColumnDef, RowAction } from '@/components/entity/EntityTable';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import AssetDialog from './AssetDialog';
import { AssetInfo, assetApi } from '@/api/asset.api';
import { PageLink } from '@/models/page.model';
import { useTranslation } from 'react-i18next';

export default function AssetsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<AssetInfo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AssetInfo | null>(null);

  const refresh = () => setRefreshTrigger((n) => n + 1);

  const columns: ColumnDef<AssetInfo>[] = [
    { id: 'createdTime', label: t('common.created-time'), width: '170px', render: (r) => new Date(r.createdTime).toLocaleString() },
    { id: 'name', label: 'Name', width: '25%' },
    { id: 'assetProfileName', label: 'Asset Profile', width: '20%' },
    { id: 'label', label: 'Label', width: '15%' },
    { id: 'customerTitle', label: 'Customer', width: '15%' },
  ];

  const rowActions: RowAction<AssetInfo>[] = [
    { icon: <VisibilityIcon fontSize="small" />, tooltip: 'View', onClick: (r) => navigate(`/entities/assets/${r.id.id}`) },
    { icon: <EditIcon fontSize="small" />, tooltip: 'Edit', onClick: (r) => { setEditAsset(r); setDialogOpen(true); } },
    { icon: <DeleteIcon fontSize="small" color="error" />, tooltip: 'Delete', onClick: (r) => { setToDelete(r); setDeleteDialogOpen(true); } },
  ];

  const fetchData = useCallback((pl: PageLink) => assetApi.getTenantAssetInfos(pl), []);

  const handleSaved = () => { setDialogOpen(false); setEditAsset(null); refresh(); };
  const handleDelete = async () => {
    if (toDelete) { await assetApi.deleteAsset(toDelete.id.id); setDeleteDialogOpen(false); setToDelete(null); refresh(); }
  };
  const handleDeleteSelected = async (rows: AssetInfo[]) => {
    await Promise.all(rows.map((r) => assetApi.deleteAsset(r.id.id))); refresh();
  };

  return (
    <Box>
      <EntityTable<AssetInfo>
        title={t('asset.assets')}
        columns={columns}
        fetchData={fetchData}
        onAdd={() => { setEditAsset(null); setDialogOpen(true); }}
        addLabel="Add Asset"
        rowActions={rowActions}
        onRowClick={(r) => navigate(`/entities/assets/${r.id.id}`)}
        onDeleteSelected={handleDeleteSelected}
        getRowId={(r) => r.id.id}
        refreshTrigger={refreshTrigger}
      />
      <AssetDialog open={dialogOpen} asset={editAsset}
        onClose={() => { setDialogOpen(false); setEditAsset(null); }} onSaved={handleSaved} />
      <ConfirmDialog open={deleteDialogOpen} title="Delete Asset"
        content={`Are you sure you want to delete asset "${toDelete?.name}"?`}
        onConfirm={handleDelete} onCancel={() => { setDeleteDialogOpen(false); setToDelete(null); }} />
    </Box>
  );
}
