import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EntityTable, { ColumnDef, RowAction } from '@/components/entity/EntityTable';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import EntityViewDialog from './EntityViewDialog';
import { EntityViewInfo, entityViewApi } from '@/api/entity-view.api';
import { PageLink } from '@/models/page.model';
import { useTranslation } from 'react-i18next';

export default function EntityViewsPage() {
  const { t } = useTranslation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editView, setEditView] = useState<EntityViewInfo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<EntityViewInfo | null>(null);

  const refresh = () => setRefreshTrigger((n) => n + 1);

  const columns: ColumnDef<EntityViewInfo>[] = [
    { id: 'createdTime', label: t('common.created-time'), width: '170px', render: (r) => new Date(r.createdTime).toLocaleString() },
    { id: 'name', label: 'Name', width: '25%' },
    {
      id: 'type', label: 'Type', width: '12%',
      render: (r) => <Chip label={r.type} size="small" variant="outlined" />,
    },
    {
      id: 'entityId', label: 'Entity Type', width: '12%', sortable: false,
      render: (r) => r.entityId?.entityType || '',
    },
    { id: 'customerTitle', label: 'Customer', width: '15%', render: (r) => r.customerTitle || '' },
  ];

  const rowActions: RowAction<EntityViewInfo>[] = [
    { icon: <EditIcon fontSize="small" />, tooltip: 'Edit', onClick: (r) => { setEditView(r); setDialogOpen(true); } },
    { icon: <DeleteIcon fontSize="small" color="error" />, tooltip: 'Delete', onClick: (r) => { setToDelete(r); setDeleteDialogOpen(true); } },
  ];

  const fetchData = useCallback((pl: PageLink) => entityViewApi.getTenantEntityViewInfos(pl), []);

  const handleSaved = () => { setDialogOpen(false); setEditView(null); refresh(); };
  const handleDelete = async () => {
    if (toDelete) { await entityViewApi.deleteEntityView(toDelete.id.id); setDeleteDialogOpen(false); setToDelete(null); refresh(); }
  };
  const handleDeleteSelected = async (rows: EntityViewInfo[]) => {
    await Promise.all(rows.map((r) => entityViewApi.deleteEntityView(r.id.id))); refresh();
  };

  return (
    <Box>
      <EntityTable<EntityViewInfo>
        title={t('entity-view.entity-views')}
        columns={columns}
        fetchData={fetchData}
        onAdd={() => { setEditView(null); setDialogOpen(true); }}
        addLabel="Add Entity View"
        rowActions={rowActions}
        onDeleteSelected={handleDeleteSelected}
        getRowId={(r) => r.id.id}
        refreshTrigger={refreshTrigger}
      />
      <EntityViewDialog open={dialogOpen} entityView={editView}
        onClose={() => { setDialogOpen(false); setEditView(null); }} onSaved={handleSaved} />
      <ConfirmDialog open={deleteDialogOpen} title="Delete Entity View"
        content={`Are you sure you want to delete entity view "${toDelete?.name}"?`}
        onConfirm={handleDelete} onCancel={() => { setDeleteDialogOpen(false); setToDelete(null); }} />
    </Box>
  );
}
