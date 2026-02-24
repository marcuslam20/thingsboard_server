import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import { Device } from '@/models/device.model';
import { deviceApi } from '@/api/device.api';
import { deviceProfileApi } from '@/api/device-profile.api';

interface DeviceProfileInfo {
  id: { id: string; entityType: string };
  name: string;
  type: string;
  transportType: string;
}

interface DeviceFormData {
  name: string;
  label: string;
  deviceProfileId: string;
  isGateway: boolean;
  description: string;
}

interface DeviceDialogProps {
  open: boolean;
  device?: Device | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function DeviceDialog({ open, device, onClose, onSaved }: DeviceDialogProps) {
  const isEdit = !!device;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profiles, setProfiles] = useState<DeviceProfileInfo[]>([]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<DeviceFormData>({
    defaultValues: {
      name: '',
      label: '',
      deviceProfileId: '',
      isGateway: false,
      description: '',
    },
  });

  useEffect(() => {
    if (open) {
      deviceProfileApi.getDeviceProfileInfos({ page: 0, pageSize: 100, sortProperty: 'name', sortOrder: 'ASC' })
        .then((res) => {
          setProfiles(res.data);
          if (!isEdit && res.data.length > 0) {
            // Find default profile or use first
            const defaultProfile = res.data.find((p) => p.name === 'default') || res.data[0];
            reset({
              name: '',
              label: '',
              deviceProfileId: defaultProfile.id.id,
              isGateway: false,
              description: '',
            });
          }
        })
        .catch(console.error);

      if (device) {
        reset({
          name: device.name,
          label: device.label || '',
          deviceProfileId: device.deviceProfileId?.id || '',
          isGateway: !!(device.additionalInfo as Record<string, unknown>)?.gateway,
          description: ((device.additionalInfo as Record<string, unknown>)?.description as string) || '',
        });
      }
    }
  }, [open, device, isEdit, reset]);

  const onSubmit = async (data: DeviceFormData) => {
    setLoading(true);
    setError('');
    try {
      const payload: Partial<Device> = {
        ...(device || {}),
        name: data.name,
        label: data.label,
        deviceProfileId: { id: data.deviceProfileId, entityType: 'DEVICE_PROFILE' },
        additionalInfo: {
          ...(device?.additionalInfo as Record<string, unknown> || {}),
          gateway: data.isGateway,
          description: data.description,
        },
      };
      await deviceApi.saveDevice(payload);
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Device' : 'Add Device'}</DialogTitle>
      {loading && <LinearProgress />}
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Controller
            name="name"
            control={control}
            rules={{ required: 'Device name is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Name"
                fullWidth
                margin="normal"
                error={!!errors.name}
                helperText={errors.name?.message}
                autoFocus
              />
            )}
          />

          <Controller
            name="deviceProfileId"
            control={control}
            rules={{ required: 'Device profile is required' }}
            render={({ field }) => (
              <FormControl fullWidth margin="normal" error={!!errors.deviceProfileId}>
                <InputLabel>Device Profile</InputLabel>
                <Select {...field} label="Device Profile">
                  {profiles.map((p) => (
                    <MenuItem key={p.id.id} value={p.id.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />

          <Controller
            name="label"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Label" fullWidth margin="normal" />
            )}
          />

          <Controller
            name="isGateway"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox checked={field.value} onChange={field.onChange} />}
                label="Is gateway"
                sx={{ mt: 1 }}
              />
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Description"
                fullWidth
                margin="normal"
                multiline
                rows={3}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {isEdit ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
