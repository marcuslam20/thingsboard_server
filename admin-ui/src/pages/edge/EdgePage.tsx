import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EntityTable, { ColumnDef, RowAction } from '@/components/entity/EntityTable';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import EdgeDialog from './EdgeDialog';
import { EdgeInfo, edgeApi } from '@/api/edge.api';
import { PageLink } from '@/models/page.model';
import { useTranslation } from 'react-i18next';

export default function EdgePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEdge, setEditEdge] = useState<EdgeInfo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<EdgeInfo | null>(null);

  const refresh = () => setRefreshTrigger((n) => n + 1);

  const columns: ColumnDef<EdgeInfo>[] = [
    { id: 'createdTime', label: t('common.created-time'), width: '170px', render: (r) => new Date(r.createdTime).toLocaleString() },
    { id: 'name', label: 'Name', width: '22%' },
    { id: 'type', label: 'Type', width: '15%' },
    { id: 'label', label: 'Label', width: '15%', render: (r) => r.label || '' },
    { id: 'routingKey', label: 'Routing Key', width: '18%', render: (r) => r.routingKey || '' },
    { id: 'customerTitle', label: 'Customer', width: '15%', render: (r) => r.customerTitle || '' },
  ];

  const rowActions: RowAction<EdgeInfo>[] = [
    { icon: <EditIcon fontSize="small" />, tooltip: 'Edit', onClick: (r) => { setEditEdge(r); setDialogOpen(true); } },
    { icon: <DeleteIcon fontSize="small" color="error" />, tooltip: 'Delete', onClick: (r) => { setToDelete(r); setDeleteDialogOpen(true); } },
  ];

  const fetchData = useCallback((pl: PageLink) => edgeApi.getTenantEdgeInfos(pl), []);

  const handleSaved = () => { setDialogOpen(false); setEditEdge(null); refresh(); };
  const handleDelete = async () => {
    if (toDelete) { await edgeApi.deleteEdge(toDelete.id.id); setDeleteDialogOpen(false); setToDelete(null); refresh(); }
  };
  const handleDeleteSelected = async (rows: EdgeInfo[]) => {
    await Promise.all(rows.map((r) => edgeApi.deleteEdge(r.id.id))); refresh();
  };

  return (
    <Box>
      <EntityTable<EdgeInfo>
        title={t('edge.edges')}
        columns={columns}
        fetchData={fetchData}
        onAdd={() => { setEditEdge(null); setDialogOpen(true); }}
        onRowClick={(r) => navigate(`/edgeManagement/edges/${r.id.id}`)}
        addLabel="Add Edge"
        rowActions={rowActions}
        onDeleteSelected={handleDeleteSelected}
        getRowId={(r) => r.id.id}
        refreshTrigger={refreshTrigger}
      />
      <EdgeDialog open={dialogOpen} edge={editEdge}
        onClose={() => { setDialogOpen(false); setEditEdge(null); }} onSaved={handleSaved} />
      <ConfirmDialog open={deleteDialogOpen} title="Delete Edge"
        content={`Are you sure you want to delete edge "${toDelete?.name}"?`}
        onConfirm={handleDelete} onCancel={() => { setDeleteDialogOpen(false); setToDelete(null); }} />
    </Box>
  );
}
