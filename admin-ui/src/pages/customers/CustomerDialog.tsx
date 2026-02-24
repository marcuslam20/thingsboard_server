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
import Grid from '@mui/material/Grid';
import { Customer, customerApi } from '@/api/customer.api';

interface FormData {
  title: string;
  country: string;
  city: string;
  state: string;
  zip: string;
  address: string;
  address2: string;
  phone: string;
  email: string;
  description: string;
}

interface Props {
  open: boolean;
  customer?: Customer | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function CustomerDialog({ open, customer, onClose, onSaved }: Props) {
  const isEdit = !!customer;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { title: '', country: '', city: '', state: '', zip: '', address: '', address2: '', phone: '', email: '', description: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: customer?.title || '',
        country: customer?.country || '',
        city: customer?.city || '',
        state: customer?.state || '',
        zip: customer?.zip || '',
        address: customer?.address || '',
        address2: customer?.address2 || '',
        phone: customer?.phone || '',
        email: customer?.email || '',
        description: (customer?.additionalInfo?.description as string) || '',
      });
    }
  }, [open, customer, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await customerApi.saveCustomer({
        ...(customer || {}),
        title: data.title,
        name: data.title,
        country: data.country,
        city: data.city,
        state: data.state,
        zip: data.zip,
        address: data.address,
        address2: data.address2,
        phone: data.phone,
        email: data.email,
        additionalInfo: { ...(customer?.additionalInfo || {}), description: data.description },
      });
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
      {loading && <LinearProgress />}
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Controller name="title" control={control} rules={{ required: 'Title is required' }}
            render={({ field }) => <TextField {...field} label="Title" fullWidth margin="normal" error={!!errors.title} helperText={errors.title?.message} autoFocus />} />
          <Controller name="email" control={control}
            render={({ field }) => <TextField {...field} label="Email" fullWidth margin="normal" />} />
          <Controller name="phone" control={control}
            render={({ field }) => <TextField {...field} label="Phone" fullWidth margin="normal" />} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Controller name="country" control={control}
                render={({ field }) => <TextField {...field} label="Country" fullWidth margin="normal" />} />
            </Grid>
            <Grid item xs={6}>
              <Controller name="state" control={control}
                render={({ field }) => <TextField {...field} label="State" fullWidth margin="normal" />} />
            </Grid>
            <Grid item xs={6}>
              <Controller name="city" control={control}
                render={({ field }) => <TextField {...field} label="City" fullWidth margin="normal" />} />
            </Grid>
            <Grid item xs={6}>
              <Controller name="zip" control={control}
                render={({ field }) => <TextField {...field} label="ZIP" fullWidth margin="normal" />} />
            </Grid>
          </Grid>
          <Controller name="address" control={control}
            render={({ field }) => <TextField {...field} label="Address" fullWidth margin="normal" />} />
          <Controller name="address2" control={control}
            render={({ field }) => <TextField {...field} label="Address 2" fullWidth margin="normal" />} />
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
