/*
 * Copyright © 2016-2025 The Thingsboard Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
    { id: 'title', label: t('customer.title'), width: '25%' },
    { id: 'email', label: t('customer.email'), width: '20%' },
    { id: 'country', label: t('customer.country'), width: '15%' },
    { id: 'city', label: t('customer.city'), width: '15%' },
  ];

  const rowActions: RowAction<Customer>[] = [
    { icon: <EditIcon fontSize="small" />, tooltip: t('action.edit'), onClick: (r) => { setEditCustomer(r); setDialogOpen(true); } },
    { icon: <DeleteIcon fontSize="small" color="error" />, tooltip: t('action.delete'), onClick: (r) => { setToDelete(r); setDeleteDialogOpen(true); } },
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
        addLabel={t('customer.add')}
        rowActions={rowActions}
        onDeleteSelected={handleDeleteSelected}
        getRowId={(r) => r.id.id}
        refreshTrigger={refreshTrigger}
      />
      <CustomerDialog open={dialogOpen} customer={editCustomer}
        onClose={() => { setDialogOpen(false); setEditCustomer(null); }} onSaved={handleSaved} />
      <ConfirmDialog open={deleteDialogOpen} title={t('customer.delete-title')}
        content={t('customer.delete-confirm', { name: toDelete?.title })}
        onConfirm={handleDelete} onCancel={() => { setDeleteDialogOpen(false); setToDelete(null); }} />
    </Box>
  );
}
