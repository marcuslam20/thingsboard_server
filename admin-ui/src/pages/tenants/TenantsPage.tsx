import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EntityTable, { ColumnDef, RowAction } from '@/components/entity/EntityTable';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import TenantDialog from './TenantDialog';
import { TenantInfo, tenantApi } from '@/api/tenant.api';
import { PageLink } from '@/models/page.model';
import { useTranslation } from 'react-i18next';

export default function TenantsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<TenantInfo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<TenantInfo | null>(null);

  const refresh = () => setRefreshTrigger((n) => n + 1);

  const columns: ColumnDef<TenantInfo>[] = [
    { id: 'createdTime', label: t('common.created-time'), width: '170px', render: (r) => new Date(r.createdTime).toLocaleString() },
    { id: 'title', label: 'Title', width: '25%' },
    { id: 'tenantProfileName', label: 'Tenant Profile', width: '20%' },
    { id: 'email', label: 'Email', width: '15%' },
    { id: 'country', label: 'Country', width: '10%' },
    { id: 'city', label: 'City', width: '10%' },
  ];

  const rowActions: RowAction<TenantInfo>[] = [
    { icon: <EditIcon fontSize="small" />, tooltip: 'Edit', onClick: (r) => { setEditTenant(r); setDialogOpen(true); } },
    { icon: <DeleteIcon fontSize="small" color="error" />, tooltip: 'Delete', onClick: (r) => { setToDelete(r); setDeleteDialogOpen(true); } },
  ];

  const fetchData = useCallback((pl: PageLink) => tenantApi.getTenants(pl), []);

  const handleSaved = () => { setDialogOpen(false); setEditTenant(null); refresh(); };
  const handleDelete = async () => {
    if (toDelete) { await tenantApi.deleteTenant(toDelete.id.id); setDeleteDialogOpen(false); setToDelete(null); refresh(); }
  };
  const handleDeleteSelected = async (rows: TenantInfo[]) => {
    await Promise.all(rows.map((r) => tenantApi.deleteTenant(r.id.id))); refresh();
  };

  return (
    <Box>
      <EntityTable<TenantInfo>
        title={t('tenant.tenants')}
        columns={columns}
        fetchData={fetchData}
        onAdd={() => { setEditTenant(null); setDialogOpen(true); }}
        onRowClick={(r) => navigate(`/tenants/${r.id.id}`)}
        addLabel="Add Tenant"
        rowActions={rowActions}
        onDeleteSelected={handleDeleteSelected}
        getRowId={(r) => r.id.id}
        refreshTrigger={refreshTrigger}
      />
      <TenantDialog open={dialogOpen} tenant={editTenant}
        onClose={() => { setDialogOpen(false); setEditTenant(null); }} onSaved={handleSaved} />
      <ConfirmDialog open={deleteDialogOpen} title="Delete Tenant"
        content={`Are you sure you want to delete tenant "${toDelete?.title}"?`}
        onConfirm={handleDelete} onCancel={() => { setDeleteDialogOpen(false); setToDelete(null); }} />
    </Box>
  );
}
