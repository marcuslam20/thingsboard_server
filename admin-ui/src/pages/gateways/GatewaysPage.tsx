import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EntityTable, { ColumnDef, RowAction } from '@/components/entity/EntityTable';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import { deviceApi } from '@/api/device.api';
import { DeviceInfo } from '@/models/device.model';
import { PageData, PageLink } from '@/models/page.model';

interface GatewayFormData {
  name: string;
  label: string;
  type: string;
}

export default function GatewaysPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGateway, setEditGateway] = useState<DeviceInfo | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [gatewayToDelete, setGatewayToDelete] = useState<DeviceInfo | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<GatewayFormData>({
    defaultValues: { name: '', label: '', type: 'Gateway' },
  });

  const fetchData = useCallback(async (pl: PageLink): Promise<PageData<DeviceInfo>> => {
    return deviceApi.getTenantDeviceInfos(pl, 'Gateway');
  }, []);

  const columns: ColumnDef<DeviceInfo>[] = [
    {
      id: 'createdTime',
      label: 'Created Time',
      render: (row) => row.createdTime ? new Date(row.createdTime).toLocaleString() : '',
      width: '180px',
    },
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => row.name,
    },
    {
      id: 'label',
      label: 'Label',
      sortable: false,
      render: (row) => row.label || '',
    },
    {
      id: 'type',
      label: 'Type',
      width: '120px',
      sortable: false,
      render: (row) => row.type || '',
    },
    {
      id: 'active',
      label: 'Status',
      width: '100px',
      sortable: false,
      render: (row) => (
        <Chip
          label={row.active ? 'Online' : 'Offline'}
          size="small"
          color={row.active ? 'success' : 'default'}
          variant="outlined"
        />
      ),
    },
  ];

  const rowActions: RowAction<DeviceInfo>[] = [
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit',
      onClick: (row) => handleEdit(row),
    },
    {
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Delete',
      onClick: (row) => {
        setGatewayToDelete(row);
        setDeleteOpen(true);
      },
    },
  ];

  const handleAdd = () => {
    setEditGateway(null);
    reset({ name: '', label: '', type: 'Gateway' });
    setDialogOpen(true);
  };

  const handleEdit = (gateway: DeviceInfo) => {
    setEditGateway(gateway);
    reset({
      name: gateway.name,
      label: gateway.label || '',
      type: gateway.type || 'Gateway',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: GatewayFormData) => {
    setSaving(true);
    setError('');
    try {
      if (editGateway) {
        const existing = await deviceApi.getDevice(editGateway.id.id);
        await deviceApi.saveDevice({
          ...existing,
          name: data.name,
          label: data.label,
          type: data.type,
        });
      } else {
        await deviceApi.saveDevice({
          name: data.name,
          label: data.label,
          type: data.type || 'Gateway',
          additionalInfo: { gateway: true },
        });
      }
      setDialogOpen(false);
      setRefreshTrigger((p) => p + 1);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save gateway');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!gatewayToDelete?.id) return;
    try {
      await deviceApi.deleteDevice(gatewayToDelete.id.id);
      setDeleteOpen(false);
      setGatewayToDelete(null);
      setRefreshTrigger((p) => p + 1);
    } catch {
      // Ignore
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>IoT Gateways</Typography>

      <EntityTable<DeviceInfo>
        title="Gateways"
        columns={columns}
        fetchData={fetchData}
        onAdd={handleAdd}
        rowActions={rowActions}
        getRowId={(row) => row.id.id}
        refreshTrigger={refreshTrigger}
        onDeleteSelected={async (selected) => {
          for (const g of selected) {
            await deviceApi.deleteDevice(g.id.id);
          }
          setRefreshTrigger((p) => p + 1);
        }}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editGateway ? 'Edit Gateway' : 'Add Gateway'}</DialogTitle>
        {saving && <LinearProgress />}
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Controller name="name" control={control} rules={{ required: 'Name is required' }}
              render={({ field }) => (
                <TextField {...field} label="Gateway Name" fullWidth size="small" margin="normal" autoFocus
                  error={!!errors.name} helperText={errors.name?.message} />
              )} />
            <Controller name="label" control={control}
              render={({ field }) => (
                <TextField {...field} label="Label" fullWidth size="small" margin="normal" />
              )} />
            <Controller name="type" control={control}
              render={({ field }) => (
                <TextField {...field} label="Type" fullWidth size="small" margin="normal"
                  helperText="e.g., Gateway" />
              )} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {editGateway ? 'Save' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Gateway"
        content={`Are you sure you want to delete "${gatewayToDelete?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setGatewayToDelete(null); }}
      />
    </Box>
  );
}
