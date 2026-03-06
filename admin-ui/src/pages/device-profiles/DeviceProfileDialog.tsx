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
import { ProductCategory } from '@/models/datapoint.model';
import { deviceProfileApi } from '@/api/device-profile.api';
import { smartHomeProductApi } from '@/api/smarthome-product.api';

interface FormData {
  name: string;
  type: DeviceProfileType;
  transportType: DeviceTransportType;
  description: string;
  categoryId: string;
  productModel: string;
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
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: '', type: DeviceProfileType.DEFAULT, transportType: DeviceTransportType.DEFAULT,
      description: '', categoryId: '', productModel: '',
    },
  });

  useEffect(() => {
    if (open) {
      smartHomeProductApi.getCategories(0, 100)
        .then((result) => setCategories(result.data))
        .catch(() => setCategories([]));

      reset({
        name: profile?.name || '',
        type: profile?.type || DeviceProfileType.DEFAULT,
        transportType: profile?.transportType || DeviceTransportType.DEFAULT,
        description: profile?.description || '',
        categoryId: profile?.categoryId?.id || '',
        productModel: profile?.productModel || '',
      });
    }
  }, [open, profile, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        ...(profile || {}),
        name: data.name,
        type: data.type,
        transportType: data.transportType,
        description: data.description,
      };
      // Backend requires profileData with transport/profile/provision/alarm configs
      if (!payload.profileData) {
        payload.profileData = {
          configuration: { type: data.type },
          transportConfiguration: { type: data.transportType },
          provisionConfiguration: { type: 'DISABLED', provisionDeviceSecret: null },
          alarms: [],
        };
      }
      if (data.categoryId) {
        payload.categoryId = { id: data.categoryId, entityType: 'PRODUCT_CATEGORY' };
      }
      if (data.productModel) {
        payload.productModel = data.productModel;
      }
      await deviceProfileApi.saveDeviceProfile(payload);
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
      <DialogTitle>{isEdit ? 'Edit Product' : 'Create Product'}</DialogTitle>
      {loading && <LinearProgress />}
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Controller name="name" control={control} rules={{ required: 'Name is required' }}
            render={({ field }) => <TextField {...field} label="Product Name" fullWidth margin="normal" error={!!errors.name} helperText={errors.name?.message} autoFocus />} />
          <Controller name="categoryId" control={control}
            render={({ field }) => (
              <TextField {...field} select label="Category" fullWidth margin="normal">
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id.id} value={cat.id.id}>
                    {cat.name} ({cat.code})
                  </MenuItem>
                ))}
              </TextField>
            )} />
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
              <TextField {...field} select label="Protocol" fullWidth margin="normal" disabled={isEdit}>
                {Object.values(DeviceTransportType).map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>
            )} />
          <Controller name="productModel" control={control}
            render={({ field }) => <TextField {...field} label="Product Model" fullWidth margin="normal" placeholder="e.g. ESP32-S3" />} />
          <Controller name="description" control={control}
            render={({ field }) => <TextField {...field} label="Description" fullWidth margin="normal" multiline rows={2} />} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>{isEdit ? 'Save' : 'Create'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
