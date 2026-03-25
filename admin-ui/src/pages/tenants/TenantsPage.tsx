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
    { id: 'title', label: t('tenant.title'), width: '25%' },
    { id: 'tenantProfileName', label: t('tenant.tenant-profile'), width: '20%' },
    { id: 'email', label: t('common.email'), width: '15%' },
    { id: 'country', label: t('common.country'), width: '10%' },
    { id: 'city', label: t('common.city'), width: '10%' },
  ];

  const rowActions: RowAction<TenantInfo>[] = [
    { icon: <EditIcon fontSize="small" />, tooltip: t('action.edit'), onClick: (r) => { setEditTenant(r); setDialogOpen(true); } },
    { icon: <DeleteIcon fontSize="small" color="error" />, tooltip: t('action.delete'), onClick: (r) => { setToDelete(r); setDeleteDialogOpen(true); } },
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
        addLabel={t('tenant.add')}
        rowActions={rowActions}
        onDeleteSelected={handleDeleteSelected}
        getRowId={(r) => r.id.id}
        refreshTrigger={refreshTrigger}
      />
      <TenantDialog open={dialogOpen} tenant={editTenant}
        onClose={() => { setDialogOpen(false); setEditTenant(null); }} onSaved={handleSaved} />
      <ConfirmDialog open={deleteDialogOpen} title={t('tenant.delete-title')}
        content={t('tenant.delete-confirm', { title: toDelete?.title })}
        onConfirm={handleDelete} onCancel={() => { setDeleteDialogOpen(false); setToDelete(null); }} />
    </Box>
  );
}
