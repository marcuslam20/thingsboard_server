import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import { Edge, edgeApi } from '@/api/edge.api';

interface FormData {
  name: string;
  type: string;
  label: string;
  routingKey: string;
  secret: string;
}

interface Props {
  open: boolean;
  edge?: Edge | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EdgeDialog({ open, edge, onClose, onSaved }: Props) {
  const isEdit = !!edge;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { name: '', type: '', label: '', routingKey: '', secret: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: edge?.name || '',
        type: edge?.type || '',
        label: edge?.label || '',
        routingKey: edge?.routingKey || '',
        secret: edge?.secret || '',
      });
    }
  }, [open, edge, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await edgeApi.saveEdge({
        ...(edge || {}),
        name: data.name,
        type: data.type,
        label: data.label,
        routingKey: data.routingKey || undefined,
        secret: data.secret || undefined,
      });
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save edge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Edge' : 'Add Edge'}</DialogTitle>
      {loading && <LinearProgress />}
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Controller name="name" control={control} rules={{ required: 'Name is required' }}
            render={({ field }) => <TextField {...field} label="Name" fullWidth margin="normal" error={!!errors.name} helperText={errors.name?.message} autoFocus />} />
          <Controller name="type" control={control} rules={{ required: 'Type is required' }}
            render={({ field }) => <TextField {...field} label="Type" fullWidth margin="normal" error={!!errors.type} helperText={errors.type?.message} />} />
          <Controller name="label" control={control}
            render={({ field }) => <TextField {...field} label="Label" fullWidth margin="normal" />} />
          <Controller name="routingKey" control={control}
            render={({ field }) => <TextField {...field} label="Routing Key" fullWidth margin="normal" />} />
          <Controller name="secret" control={control}
            render={({ field }) => <TextField {...field} label="Secret" fullWidth margin="normal" />} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>{isEdit ? 'Save' : 'Add'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
