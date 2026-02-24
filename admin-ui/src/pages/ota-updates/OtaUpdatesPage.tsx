import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EntityTable, { ColumnDef, RowAction } from '@/components/entity/EntityTable';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import OtaUpdateDialog from './OtaUpdateDialog';
import { OtaPackageInfo, otaUpdateApi } from '@/api/ota-update.api';
import { PageLink } from '@/models/page.model';
import { useTranslation } from 'react-i18next';

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function OtaUpdatesPage() {
  const { t } = useTranslation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPkg, setEditPkg] = useState<OtaPackageInfo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<OtaPackageInfo | null>(null);

  const refresh = () => setRefreshTrigger((n) => n + 1);

  const columns: ColumnDef<OtaPackageInfo>[] = [
    { id: 'createdTime', label: t('common.created-time'), width: '160px', render: (r) => new Date(r.createdTime).toLocaleString() },
    { id: 'title', label: 'Title', width: '22%' },
    { id: 'version', label: 'Version', width: '10%' },
    {
      id: 'type', label: 'Type', width: '10%',
      render: (r) => <Chip label={r.type} size="small" color={r.type === 'FIRMWARE' ? 'primary' : 'secondary'} variant="outlined" />,
    },
    { id: 'deviceProfileName', label: 'Device Profile', width: '15%', render: (r) => r.deviceProfileName || '' },
    { id: 'tag', label: 'Tag', width: '10%', render: (r) => r.tag || '' },
    {
      id: 'hasData', label: 'Data', width: '10%', sortable: false,
      render: (r) => r.hasData ? <Chip label={formatBytes(r.dataSize)} size="small" color="success" variant="outlined" /> : <Chip label="No data" size="small" variant="outlined" />,
    },
  ];

  const rowActions: RowAction<OtaPackageInfo>[] = [
    { icon: <EditIcon fontSize="small" />, tooltip: 'Edit', onClick: (r) => { setEditPkg(r); setDialogOpen(true); } },
    { icon: <DeleteIcon fontSize="small" color="error" />, tooltip: 'Delete', onClick: (r) => { setToDelete(r); setDeleteDialogOpen(true); } },
  ];

  const fetchData = useCallback((pl: PageLink) => otaUpdateApi.getOtaPackagesV2(pl), []);

  const handleSaved = () => { setDialogOpen(false); setEditPkg(null); refresh(); };
  const handleDelete = async () => {
    if (toDelete) { await otaUpdateApi.deleteOtaPackage(toDelete.id.id); setDeleteDialogOpen(false); setToDelete(null); refresh(); }
  };
  const handleDeleteSelected = async (rows: OtaPackageInfo[]) => {
    await Promise.all(rows.map((r) => otaUpdateApi.deleteOtaPackage(r.id.id))); refresh();
  };

  return (
    <Box>
      <EntityTable<OtaPackageInfo>
        title={t('ota-update.ota-updates')}
        columns={columns}
        fetchData={fetchData}
        onAdd={() => { setEditPkg(null); setDialogOpen(true); }}
        addLabel="Add OTA Package"
        rowActions={rowActions}
        onDeleteSelected={handleDeleteSelected}
        getRowId={(r) => r.id.id}
        refreshTrigger={refreshTrigger}
      />
      <OtaUpdateDialog open={dialogOpen} otaPackage={editPkg}
        onClose={() => { setDialogOpen(false); setEditPkg(null); }} onSaved={handleSaved} />
      <ConfirmDialog open={deleteDialogOpen} title="Delete OTA Package"
        content={`Are you sure you want to delete OTA package "${toDelete?.title} v${toDelete?.version}"?`}
        onConfirm={handleDelete} onCancel={() => { setDeleteDialogOpen(false); setToDelete(null); }} />
    </Box>
  );
}
