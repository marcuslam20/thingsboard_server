import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import { TenantProfile, tenantProfileApi } from '@/api/tenant-profile.api';

interface FormData {
  name: string;
  description: string;
  isolatedTbRuleEngine: boolean;
}

interface Props {
  open: boolean;
  profile?: TenantProfile | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function TenantProfileDialog({ open, profile, onClose, onSaved }: Props) {
  const isEdit = !!profile;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { name: '', description: '', isolatedTbRuleEngine: false },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: profile?.name || '',
        description: profile?.description || '',
        isolatedTbRuleEngine: profile?.isolatedTbRuleEngine || false,
      });
    }
  }, [open, profile, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await tenantProfileApi.saveTenantProfile({
        ...(profile || {}),
        name: data.name,
        description: data.description,
        isolatedTbRuleEngine: data.isolatedTbRuleEngine,
      });
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save tenant profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Tenant Profile' : 'Add Tenant Profile'}</DialogTitle>
      {loading && <LinearProgress />}
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Controller name="name" control={control} rules={{ required: 'Name is required' }}
            render={({ field }) => <TextField {...field} label="Name" fullWidth margin="normal" error={!!errors.name} helperText={errors.name?.message} autoFocus />} />
          <Controller name="isolatedTbRuleEngine" control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox checked={field.value} onChange={field.onChange} />}
                label="Isolated Rule Engine"
                sx={{ mt: 1 }}
              />
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
