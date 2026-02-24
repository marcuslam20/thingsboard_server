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
import { User } from '@/models/user.model';
import { Authority } from '@/models/authority.model';
import { userApi } from '@/api/user.api';
import { useAppSelector } from '@/store/store';
import { selectAuthority } from '@/store/auth.slice';

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  authority: Authority;
  description: string;
}

interface Props {
  open: boolean;
  user?: User | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function UserDialog({ open, user, onClose, onSaved }: Props) {
  const isEdit = !!user;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const currentAuthority = useAppSelector(selectAuthority);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { email: '', firstName: '', lastName: '', phone: '', authority: Authority.TENANT_ADMIN, description: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        email: user?.email || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        authority: user?.authority || (currentAuthority === Authority.SYS_ADMIN ? Authority.TENANT_ADMIN : Authority.CUSTOMER_USER),
        description: (user?.additionalInfo?.description as string) || '',
      });
    }
  }, [open, user, reset, currentAuthority]);

  const authorityOptions = currentAuthority === Authority.SYS_ADMIN
    ? [Authority.SYS_ADMIN, Authority.TENANT_ADMIN]
    : [Authority.CUSTOMER_USER];

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await userApi.saveUser({
        ...(user || {}),
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        authority: data.authority,
        additionalInfo: { ...(user?.additionalInfo || {}), description: data.description },
      }, !isEdit);
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit User' : 'Add User'}</DialogTitle>
      {loading && <LinearProgress />}
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Controller name="email" control={control} rules={{ required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } }}
            render={({ field }) => <TextField {...field} label="Email" fullWidth margin="normal" error={!!errors.email} helperText={errors.email?.message} autoFocus disabled={isEdit} />} />
          <Controller name="firstName" control={control} rules={{ required: 'First name is required' }}
            render={({ field }) => <TextField {...field} label="First Name" fullWidth margin="normal" error={!!errors.firstName} helperText={errors.firstName?.message} />} />
          <Controller name="lastName" control={control} rules={{ required: 'Last name is required' }}
            render={({ field }) => <TextField {...field} label="Last Name" fullWidth margin="normal" error={!!errors.lastName} helperText={errors.lastName?.message} />} />
          <Controller name="phone" control={control}
            render={({ field }) => <TextField {...field} label="Phone" fullWidth margin="normal" />} />
          {!isEdit && (
            <Controller name="authority" control={control}
              render={({ field }) => (
                <TextField {...field} select label="Authority" fullWidth margin="normal">
                  {authorityOptions.map((auth) => (
                    <MenuItem key={auth} value={auth}>{auth.replace('_', ' ')}</MenuItem>
                  ))}
                </TextField>
              )} />
          )}
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
