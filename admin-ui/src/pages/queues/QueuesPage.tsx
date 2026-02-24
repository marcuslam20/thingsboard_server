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
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EntityTable, { ColumnDef, RowAction } from '@/components/entity/EntityTable';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import { queueApi, QueueInfo } from '@/api/queue.api';
import { PageLink } from '@/models/page.model';

const SUBMIT_STRATEGIES = ['BURST', 'BATCH', 'SEQUENTIAL_BY_ORIGINATOR', 'SEQUENTIAL_BY_TENANT', 'SEQUENTIAL'];
const PROCESSING_STRATEGIES = ['SKIP_ALL_FAILURES', 'SKIP_ALL_FAILURES_AND_TIMED_OUT', 'RETRY_ALL', 'RETRY_FAILED', 'RETRY_TIMED_OUT', 'RETRY_FAILED_AND_TIMED_OUT'];

interface QueueFormData {
  name: string;
  partitions: number;
  pollInterval: number;
  packProcessingTimeout: number;
  submitStrategyType: string;
  submitStrategyBatchSize: number;
  processingStrategyType: string;
  processingStrategyRetries: number;
  processingStrategyPause: number;
}

export default function QueuesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editQueue, setEditQueue] = useState<QueueInfo | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<QueueInfo | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const defaultValues: QueueFormData = {
    name: '', partitions: 10, pollInterval: 25, packProcessingTimeout: 60000,
    submitStrategyType: 'BURST', submitStrategyBatchSize: 1000,
    processingStrategyType: 'SKIP_ALL_FAILURES', processingStrategyRetries: 3,
    processingStrategyPause: 3,
  };

  const { control, handleSubmit, reset, watch, formState: { errors: formErrors } } = useForm<QueueFormData>({ defaultValues });
  const submitType = watch('submitStrategyType');

  const columns: ColumnDef<QueueInfo>[] = [
    { id: 'createdTime', label: 'Created Time', width: '170px', render: (r) => new Date(r.createdTime).toLocaleString() },
    { id: 'name', label: 'Name', render: (r) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {r.name}
        {r.name === 'Main' && <Chip label="Main" size="small" color="primary" variant="outlined" />}
      </Box>
    )},
    { id: 'partitions', label: 'Partitions', width: '100px' },
    { id: 'submitStrategy', label: 'Submit Strategy', width: '200px', sortable: false, render: (r) => r.submitStrategy?.type || '' },
    { id: 'processingStrategy', label: 'Processing Strategy', width: '220px', sortable: false, render: (r) => r.processingStrategy?.type || '' },
  ];

  const rowActions: RowAction<QueueInfo>[] = [
    { icon: <EditIcon fontSize="small" />, tooltip: 'Edit', onClick: (r) => openEdit(r) },
    { icon: <DeleteIcon fontSize="small" color="error" />, tooltip: 'Delete', onClick: (r) => { setToDelete(r); setDeleteOpen(true); }, hidden: (r) => r.name === 'Main' },
  ];

  const fetchData = useCallback((pl: PageLink) => queueApi.getQueues(pl), []);

  const openAdd = () => {
    setEditQueue(null);
    reset(defaultValues);
    setDialogOpen(true);
  };

  const openEdit = (q: QueueInfo) => {
    setEditQueue(q);
    reset({
      name: q.name,
      partitions: q.partitions,
      pollInterval: q.pollInterval,
      packProcessingTimeout: q.packProcessingTimeout,
      submitStrategyType: q.submitStrategy?.type || 'BURST',
      submitStrategyBatchSize: q.submitStrategy?.batchSize || 1000,
      processingStrategyType: q.processingStrategy?.type || 'SKIP_ALL_FAILURES',
      processingStrategyRetries: q.processingStrategy?.retries || 3,
      processingStrategyPause: q.processingStrategy?.pauseBetweenRetries || 3,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: QueueFormData) => {
    setSaving(true);
    setError('');
    try {
      await queueApi.saveQueue({
        ...(editQueue || {}),
        name: data.name,
        partitions: data.partitions,
        pollInterval: data.pollInterval,
        packProcessingTimeout: data.packProcessingTimeout,
        submitStrategy: {
          type: data.submitStrategyType,
          ...(data.submitStrategyType === 'BATCH' ? { batchSize: data.submitStrategyBatchSize } : {}),
        },
        processingStrategy: {
          type: data.processingStrategyType,
          retries: data.processingStrategyRetries,
          pauseBetweenRetries: data.processingStrategyPause,
        },
      });
      setDialogOpen(false);
      setRefreshTrigger((p) => p + 1);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save queue');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete?.id) return;
    await queueApi.deleteQueue(toDelete.id.id);
    setDeleteOpen(false);
    setToDelete(null);
    setRefreshTrigger((p) => p + 1);
  };

  return (
    <Box>
      <EntityTable<QueueInfo>
        title="Queues"
        columns={columns}
        fetchData={fetchData}
        onAdd={openAdd}
        addLabel="Add Queue"
        rowActions={rowActions}
        getRowId={(r) => r.id.id}
        refreshTrigger={refreshTrigger}
        onDeleteSelected={async (selected) => {
          const deletable = selected.filter((q) => q.name !== 'Main');
          for (const q of deletable) await queueApi.deleteQueue(q.id.id);
          setRefreshTrigger((p) => p + 1);
        }}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editQueue ? 'Edit Queue' : 'Add Queue'}</DialogTitle>
        {saving && <LinearProgress />}
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Controller name="name" control={control} rules={{ required: 'Name is required' }}
              render={({ field }) => (
                <TextField {...field} label="Name" fullWidth size="small" margin="normal" autoFocus
                  error={!!formErrors.name} helperText={formErrors.name?.message}
                  disabled={!!editQueue} />
              )} />
            <Controller name="partitions" control={control} rules={{ required: true, min: 1 }}
              render={({ field }) => (
                <TextField {...field} label="Partitions" type="number" fullWidth size="small" margin="normal"
                  onChange={(e) => field.onChange(Number(e.target.value))} />
              )} />
            <Controller name="pollInterval" control={control}
              render={({ field }) => (
                <TextField {...field} label="Poll Interval (ms)" type="number" fullWidth size="small" margin="normal"
                  onChange={(e) => field.onChange(Number(e.target.value))} />
              )} />
            <Controller name="packProcessingTimeout" control={control}
              render={({ field }) => (
                <TextField {...field} label="Pack Processing Timeout (ms)" type="number" fullWidth size="small" margin="normal"
                  onChange={(e) => field.onChange(Number(e.target.value))} />
              )} />

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Submit Strategy</Typography>
            <Controller name="submitStrategyType" control={control}
              render={({ field }) => (
                <TextField {...field} select label="Type" fullWidth size="small" margin="dense">
                  {SUBMIT_STRATEGIES.map((s) => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>)}
                </TextField>
              )} />
            {submitType === 'BATCH' && (
              <Controller name="submitStrategyBatchSize" control={control}
                render={({ field }) => (
                  <TextField {...field} label="Batch Size" type="number" fullWidth size="small" margin="dense"
                    onChange={(e) => field.onChange(Number(e.target.value))} />
                )} />
            )}

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Processing Strategy</Typography>
            <Controller name="processingStrategyType" control={control}
              render={({ field }) => (
                <TextField {...field} select label="Type" fullWidth size="small" margin="dense">
                  {PROCESSING_STRATEGIES.map((s) => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>)}
                </TextField>
              )} />
            <Controller name="processingStrategyRetries" control={control}
              render={({ field }) => (
                <TextField {...field} label="Retries" type="number" fullWidth size="small" margin="dense"
                  onChange={(e) => field.onChange(Number(e.target.value))} />
              )} />
            <Controller name="processingStrategyPause" control={control}
              render={({ field }) => (
                <TextField {...field} label="Pause Between Retries (s)" type="number" fullWidth size="small" margin="dense"
                  onChange={(e) => field.onChange(Number(e.target.value))} />
              )} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{editQueue ? 'Save' : 'Add'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog open={deleteOpen} title="Delete Queue"
        content={`Delete queue "${toDelete?.name}"?`}
        onConfirm={handleDelete} onCancel={() => { setDeleteOpen(false); setToDelete(null); }} />
    </Box>
  );
}
