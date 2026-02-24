import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { widgetApi, WidgetsBundle } from '@/api/widget.api';
import { PageData, PageLink } from '@/models/page.model';

const NULL_UUID = '13814000-1dd2-11b2-8080-808080808080';

interface BundleFormData {
  title: string;
  description: string;
}

export default function WidgetsPage() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBundle, setEditBundle] = useState<WidgetsBundle | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bundleToDelete, setBundleToDelete] = useState<WidgetsBundle | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<BundleFormData>({
    defaultValues: { title: '', description: '' },
  });

  const fetchData = useCallback((pl: PageLink): Promise<PageData<WidgetsBundle>> => {
    return widgetApi.getWidgetsBundles(pl);
  }, []);

  const columns: ColumnDef<WidgetsBundle>[] = [
    {
      id: 'createdTime',
      label: 'Created Time',
      render: (row) => row.createdTime ? new Date(row.createdTime).toLocaleString() : '',
      width: '180px',
    },
    {
      id: 'title',
      label: 'Title',
      sortable: true,
      render: (row) => row.title,
    },
    {
      id: 'system',
      label: 'System',
      width: '80px',
      sortable: false,
      render: (row) =>
        row.tenantId?.id === NULL_UUID
          ? <Chip label="System" size="small" color="info" variant="outlined" />
          : null,
    },
  ];

  const rowActions: RowAction<WidgetsBundle>[] = [
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit',
      onClick: (row) => handleEdit(row),
    },
    {
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Delete',
      onClick: (row) => {
        setBundleToDelete(row);
        setDeleteOpen(true);
      },
      hidden: (row) => row.tenantId?.id === NULL_UUID,
    },
  ];

  const handleAdd = () => {
    setEditBundle(null);
    reset({ title: '', description: '' });
    setDialogOpen(true);
  };

  const handleEdit = (bundle: WidgetsBundle) => {
    setEditBundle(bundle);
    reset({ title: bundle.title, description: bundle.description || '' });
    setDialogOpen(true);
  };

  const onSubmit = async (data: BundleFormData) => {
    setSaving(true);
    setError('');
    try {
      await widgetApi.saveWidgetsBundle({
        ...(editBundle || {}),
        title: data.title,
        description: data.description || undefined,
      });
      setDialogOpen(false);
      setRefreshTrigger((p) => p + 1);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save widget bundle');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!bundleToDelete?.id) return;
    try {
      await widgetApi.deleteWidgetsBundle(bundleToDelete.id.id);
      setDeleteOpen(false);
      setBundleToDelete(null);
      setRefreshTrigger((p) => p + 1);
    } catch {
      // Ignore
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>Widget Library</Typography>

      <EntityTable<WidgetsBundle>
        title="Widgets Bundles"
        columns={columns}
        fetchData={fetchData}
        onAdd={handleAdd}
        onRowClick={(row) => row.id && navigate(`/widgets-bundles/${row.id.id}`)}
        rowActions={rowActions}
        getRowId={(row) => row.id?.id || row.title}
        refreshTrigger={refreshTrigger}
        onDeleteSelected={async (selected) => {
          const deletable = selected.filter((b) => b.tenantId?.id !== NULL_UUID);
          for (const b of deletable) {
            if (b.id) await widgetApi.deleteWidgetsBundle(b.id.id);
          }
          setRefreshTrigger((p) => p + 1);
        }}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editBundle ? 'Edit Widget Bundle' : 'Add Widget Bundle'}</DialogTitle>
        {saving && <LinearProgress />}
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Controller name="title" control={control} rules={{ required: 'Title is required' }}
              render={({ field }) => (
                <TextField {...field} label="Title" fullWidth size="small" margin="normal" autoFocus
                  error={!!errors.title} helperText={errors.title?.message} />
              )} />
            <Controller name="description" control={control}
              render={({ field }) => (
                <TextField {...field} label="Description" fullWidth size="small" margin="normal"
                  multiline rows={3} />
              )} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {editBundle ? 'Save' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Widget Bundle"
        content={`Are you sure you want to delete "${bundleToDelete?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setBundleToDelete(null); }}
      />
    </Box>
  );
}
