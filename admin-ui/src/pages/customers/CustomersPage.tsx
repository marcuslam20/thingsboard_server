import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EntityTable, { ColumnDef, RowAction } from '@/components/entity/EntityTable';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import CustomerDialog from './CustomerDialog';
import { Customer, customerApi } from '@/api/customer.api';
import { PageLink } from '@/models/page.model';
import { useTranslation } from 'react-i18next';

export default function CustomersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Customer | null>(null);

  const refresh = () => setRefreshTrigger((n) => n + 1);

  const columns: ColumnDef<Customer>[] = [
    { id: 'createdTime', label: t('common.created-time'), width: '170px', render: (r) => new Date(r.createdTime).toLocaleString() },
    { id: 'title', label: 'Title', width: '25%' },
    { id: 'email', label: 'Email', width: '20%' },
    { id: 'country', label: 'Country', width: '15%' },
    { id: 'city', label: 'City', width: '15%' },
  ];

  const rowActions: RowAction<Customer>[] = [
    { icon: <EditIcon fontSize="small" />, tooltip: 'Edit', onClick: (r) => { setEditCustomer(r); setDialogOpen(true); } },
    { icon: <DeleteIcon fontSize="small" color="error" />, tooltip: 'Delete', onClick: (r) => { setToDelete(r); setDeleteDialogOpen(true); } },
  ];

  const fetchData = useCallback((pl: PageLink) => customerApi.getCustomers(pl), []);

  const handleSaved = () => { setDialogOpen(false); setEditCustomer(null); refresh(); };
  const handleDelete = async () => {
    if (toDelete) { await customerApi.deleteCustomer(toDelete.id.id); setDeleteDialogOpen(false); setToDelete(null); refresh(); }
  };
  const handleDeleteSelected = async (rows: Customer[]) => {
    await Promise.all(rows.map((r) => customerApi.deleteCustomer(r.id.id))); refresh();
  };

  return (
    <Box>
      <EntityTable<Customer>
        title={t('customer.customers')}
        columns={columns}
        fetchData={fetchData}
        onAdd={() => { setEditCustomer(null); setDialogOpen(true); }}
        onRowClick={(r) => navigate(`/customers/${r.id.id}`)}
        addLabel="Add Customer"
        rowActions={rowActions}
        onDeleteSelected={handleDeleteSelected}
        getRowId={(r) => r.id.id}
        refreshTrigger={refreshTrigger}
      />
      <CustomerDialog open={dialogOpen} customer={editCustomer}
        onClose={() => { setDialogOpen(false); setEditCustomer(null); }} onSaved={handleSaved} />
      <ConfirmDialog open={deleteDialogOpen} title="Delete Customer"
        content={`Are you sure you want to delete customer "${toDelete?.title}"?`}
        onConfirm={handleDelete} onCancel={() => { setDeleteDialogOpen(false); setToDelete(null); }} />
    </Box>
  );
}
