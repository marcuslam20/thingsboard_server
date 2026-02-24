import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EntityTable, { ColumnDef, RowAction } from '@/components/entity/EntityTable';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import UserDialog from './UserDialog';
import { User } from '@/models/user.model';
import { userApi } from '@/api/user.api';
import { PageLink } from '@/models/page.model';
import { useTranslation } from 'react-i18next';

export default function UsersPage() {
  const { t } = useTranslation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<User | null>(null);

  const refresh = () => setRefreshTrigger((n) => n + 1);

  const columns: ColumnDef<User>[] = [
    { id: 'createdTime', label: t('common.created-time'), width: '170px', render: (r) => new Date(r.createdTime).toLocaleString() },
    { id: 'email', label: 'Email', width: '25%' },
    { id: 'firstName', label: 'First Name', width: '15%' },
    { id: 'lastName', label: 'Last Name', width: '15%' },
    {
      id: 'authority', label: 'Authority', width: '15%',
      render: (r) => {
        const colorMap: Record<string, 'primary' | 'warning' | 'success'> = {
          SYS_ADMIN: 'primary', TENANT_ADMIN: 'warning', CUSTOMER_USER: 'success',
        };
        return <Chip label={r.authority.replace('_', ' ')} size="small" color={colorMap[r.authority] || 'default'} />;
      },
    },
  ];

  const rowActions: RowAction<User>[] = [
    { icon: <EditIcon fontSize="small" />, tooltip: 'Edit', onClick: (r) => { setEditUser(r); setDialogOpen(true); } },
    { icon: <DeleteIcon fontSize="small" color="error" />, tooltip: 'Delete', onClick: (r) => { setToDelete(r); setDeleteDialogOpen(true); } },
  ];

  const fetchData = useCallback((pl: PageLink) => userApi.getUsers(pl), []);

  const handleSaved = () => { setDialogOpen(false); setEditUser(null); refresh(); };
  const handleDelete = async () => {
    if (toDelete) { await userApi.deleteUser(toDelete.id.id); setDeleteDialogOpen(false); setToDelete(null); refresh(); }
  };
  const handleDeleteSelected = async (rows: User[]) => {
    await Promise.all(rows.map((r) => userApi.deleteUser(r.id.id))); refresh();
  };

  return (
    <Box>
      <EntityTable<User>
        title={t('user.users')}
        columns={columns}
        fetchData={fetchData}
        onAdd={() => { setEditUser(null); setDialogOpen(true); }}
        addLabel="Add User"
        rowActions={rowActions}
        onDeleteSelected={handleDeleteSelected}
        getRowId={(r) => r.id.id}
        refreshTrigger={refreshTrigger}
      />
      <UserDialog open={dialogOpen} user={editUser}
        onClose={() => { setDialogOpen(false); setEditUser(null); }} onSaved={handleSaved} />
      <ConfirmDialog open={deleteDialogOpen} title="Delete User"
        content={`Are you sure you want to delete user "${toDelete?.email}"?`}
        onConfirm={handleDelete} onCancel={() => { setDeleteDialogOpen(false); setToDelete(null); }} />
    </Box>
  );
}
