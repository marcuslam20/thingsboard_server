import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { widgetApi, WidgetsBundle } from '@/api/widget.api';
import { PageLink } from '@/models/page.model';
import SubEntityTable, { SubColumnDef } from '@/components/entity/SubEntityTable';
import ConfirmDialog from '@/components/entity/ConfirmDialog';

const NULL_UUID = '13814000-1dd2-11b2-8080-808080808080';

const widgetTypeColumns: SubColumnDef[] = [
  { id: 'createdTime', label: 'Created Time', width: '180px', render: (r) => r.createdTime ? new Date(r.createdTime as number).toLocaleString() : '' },
  { id: 'name', label: 'Name' },
  { id: 'widgetType', label: 'Type', width: '120px' },
  { id: 'deprecated', label: 'Status', width: '100px', sortable: false, render: (r) => r.deprecated ? <Chip label="Deprecated" size="small" color="warning" variant="outlined" /> : null },
  { id: 'description', label: 'Description', render: (r) => { const d = String(r.description || ''); return d.length > 80 ? d.substring(0, 80) + '...' : d; } },
];

interface BundleFormData {
  title: string;
  description: string;
}

export default function WidgetBundleDetailPage() {
  const { bundleId } = useParams<{ bundleId: string }>();
  const navigate = useNavigate();
  const [bundle, setBundle] = useState<WidgetsBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { control, handleSubmit, reset, formState: { errors } } = useForm<BundleFormData>({
    defaultValues: { title: '', description: '' },
  });

  const isSystem = bundle?.tenantId?.id === NULL_UUID;

  const loadBundle = useCallback(() => {
    if (!bundleId) return;
    setLoading(true);
    widgetApi.getWidgetsBundle(bundleId)
      .then(setBundle)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bundleId]);

  useEffect(() => { loadBundle(); }, [loadBundle]);

  const fetchWidgetTypes = useCallback((pl: PageLink) => widgetApi.getBundleWidgetTypes(bundleId!, pl), [bundleId]);

  const handleEdit = () => {
    if (!bundle) return;
    reset({ title: bundle.title, description: bundle.description || '' });
    setEditOpen(true);
  };

  const onSubmit = async (data: BundleFormData) => {
    setSaving(true);
    setError('');
    try {
      const saved = await widgetApi.saveWidgetsBundle({
        ...bundle,
        title: data.title,
        description: data.description || undefined,
      });
      setBundle(saved);
      setEditOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!bundleId) return;
    await widgetApi.deleteWidgetsBundle(bundleId);
    navigate('/widgets-bundles');
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  if (!bundle) {
    return (
      <Box>
        <Typography>Widget bundle not found</Typography>
        <Button onClick={() => navigate('/widgets-bundles')}>Back to widget bundles</Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/widgets-bundles')}><ArrowBackIcon /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 500 }}>{bundle.title}</Typography>
            {isSystem && <Chip label="System" size="small" color="info" variant="outlined" />}
          </Box>
          {bundle.description && (
            <Typography variant="body2" color="text.secondary">{bundle.description}</Typography>
          )}
        </Box>
        {!isSystem && (
          <>
            <Button startIcon={<EditIcon />} onClick={handleEdit} variant="outlined" size="small">Edit</Button>
            <Button startIcon={<DeleteIcon />} onClick={() => setDeleteOpen(true)} color="error" variant="outlined" size="small">Delete</Button>
          </>
        )}
      </Box>

      {/* Details */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
          <Box><Typography variant="caption" color="text.secondary">Title</Typography><Typography>{bundle.title}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Alias</Typography><Typography sx={{ fontFamily: 'monospace', fontSize: 13 }}>{bundle.alias || '-'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Created</Typography><Typography>{bundle.createdTime ? new Date(bundle.createdTime).toLocaleString() : '-'}</Typography></Box>
        </Box>
      </Paper>

      {/* Widget Types Table */}
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>Widget Types</Typography>
      <SubEntityTable fetchData={fetchWidgetTypes} columns={widgetTypeColumns} />

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Widget Bundle</DialogTitle>
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
                <TextField {...field} label="Description" fullWidth size="small" margin="normal" multiline rows={3} />
              )} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog open={deleteOpen} title="Delete Widget Bundle" content={`Delete bundle "${bundle.title}"?`}
        onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />
    </Box>
  );
}
