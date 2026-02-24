import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import { EntityView, entityViewApi } from '@/api/entity-view.api';

interface FormData {
  name: string;
  type: string;
  entityType: string;
  entityId: string;
  startTimeMs: string;
  endTimeMs: string;
}

interface Props {
  open: boolean;
  entityView?: EntityView | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EntityViewDialog({ open, entityView, onClose, onSaved }: Props) {
  const isEdit = !!entityView;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { name: '', type: '', entityType: 'DEVICE', entityId: '', startTimeMs: '', endTimeMs: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: entityView?.name || '',
        type: entityView?.type || '',
        entityType: entityView?.entityId?.entityType || 'DEVICE',
        entityId: entityView?.entityId?.id || '',
        startTimeMs: entityView?.startTimeMs ? String(entityView.startTimeMs) : '',
        endTimeMs: entityView?.endTimeMs ? String(entityView.endTimeMs) : '',
      });
    }
  }, [open, entityView, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await entityViewApi.saveEntityView({
        ...(entityView || {}),
        name: data.name,
        type: data.type,
        entityId: { id: data.entityId, entityType: data.entityType },
        startTimeMs: data.startTimeMs ? Number(data.startTimeMs) : undefined,
        endTimeMs: data.endTimeMs ? Number(data.endTimeMs) : undefined,
      });
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save entity view');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Entity View' : 'Add Entity View'}</DialogTitle>
      {loading && <LinearProgress />}
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Controller name="name" control={control} rules={{ required: 'Name is required' }}
            render={({ field }) => <TextField {...field} label="Name" fullWidth margin="normal" error={!!errors.name} helperText={errors.name?.message} autoFocus />} />
          <Controller name="type" control={control} rules={{ required: 'Type is required' }}
            render={({ field }) => <TextField {...field} label="Type" fullWidth margin="normal" error={!!errors.type} helperText={errors.type?.message} />} />
          {!isEdit && (
            <>
              <Controller name="entityType" control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Entity Type" fullWidth margin="normal">
                    <MenuItem value="DEVICE">Device</MenuItem>
                    <MenuItem value="ASSET">Asset</MenuItem>
                  </TextField>
                )} />
              <Controller name="entityId" control={control} rules={{ required: 'Entity ID is required' }}
                render={({ field }) => <TextField {...field} label="Entity ID" fullWidth margin="normal" error={!!errors.entityId} helperText={errors.entityId?.message || 'UUID of the target entity'} />} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>{isEdit ? 'Save' : 'Add'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
