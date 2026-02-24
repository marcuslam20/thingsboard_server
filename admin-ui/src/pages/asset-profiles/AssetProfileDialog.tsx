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
import { AssetProfile, assetProfileApi } from '@/api/asset-profile.api';

interface FormData {
  name: string;
  description: string;
  defaultQueueName: string;
}

interface Props {
  open: boolean;
  profile?: AssetProfile | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function AssetProfileDialog({ open, profile, onClose, onSaved }: Props) {
  const isEdit = !!profile;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { name: '', description: '', defaultQueueName: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: profile?.name || '',
        description: profile?.description || '',
        defaultQueueName: profile?.defaultQueueName || '',
      });
    }
  }, [open, profile, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await assetProfileApi.saveAssetProfile({
        ...(profile || {}),
        name: data.name,
        description: data.description,
        defaultQueueName: data.defaultQueueName || undefined,
      });
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save asset profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Asset Profile' : 'Add Asset Profile'}</DialogTitle>
      {loading && <LinearProgress />}
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Controller name="name" control={control} rules={{ required: 'Name is required' }}
            render={({ field }) => <TextField {...field} label="Name" fullWidth margin="normal" error={!!errors.name} helperText={errors.name?.message} autoFocus />} />
          <Controller name="defaultQueueName" control={control}
            render={({ field }) => <TextField {...field} label="Queue Name" fullWidth margin="normal" />} />
          <Controller name="description" control={control}
            render={({ field }) => <TextField {...field} label="Description" fullWidth margin="normal" multiline rows={2} />} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>{isEdit ? 'Save' : 'Add'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
