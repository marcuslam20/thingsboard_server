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
import { DeviceProfile, DeviceProfileType, DeviceTransportType } from '@/models/device.model';
import { deviceProfileApi } from '@/api/device-profile.api';

interface FormData {
  name: string;
  type: DeviceProfileType;
  transportType: DeviceTransportType;
  description: string;
}

interface Props {
  open: boolean;
  profile?: DeviceProfile | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function DeviceProfileDialog({ open, profile, onClose, onSaved }: Props) {
  const isEdit = !!profile;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { name: '', type: DeviceProfileType.DEFAULT, transportType: DeviceTransportType.DEFAULT, description: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: profile?.name || '',
        type: profile?.type || DeviceProfileType.DEFAULT,
        transportType: profile?.transportType || DeviceTransportType.DEFAULT,
        description: profile?.description || '',
      });
    }
  }, [open, profile, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await deviceProfileApi.saveDeviceProfile({
        ...(profile || {}),
        name: data.name,
        type: data.type,
        transportType: data.transportType,
        description: data.description,
      });
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save device profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Device Profile' : 'Add Device Profile'}</DialogTitle>
      {loading && <LinearProgress />}
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Controller name="name" control={control} rules={{ required: 'Name is required' }}
            render={({ field }) => <TextField {...field} label="Name" fullWidth margin="normal" error={!!errors.name} helperText={errors.name?.message} autoFocus />} />
          <Controller name="type" control={control}
            render={({ field }) => (
              <TextField {...field} select label="Profile Type" fullWidth margin="normal" disabled={isEdit}>
                {Object.values(DeviceProfileType).map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>
            )} />
          <Controller name="transportType" control={control}
            render={({ field }) => (
              <TextField {...field} select label="Transport Type" fullWidth margin="normal" disabled={isEdit}>
                {Object.values(DeviceTransportType).map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>
            )} />
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
