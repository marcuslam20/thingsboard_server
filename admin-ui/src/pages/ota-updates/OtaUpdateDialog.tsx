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
import { OtaPackage, OtaPackageType, otaUpdateApi } from '@/api/ota-update.api';
import { DeviceProfileInfo, deviceProfileApi } from '@/api/device-profile.api';

interface FormData {
  title: string;
  version: string;
  tag: string;
  type: OtaPackageType;
  deviceProfileId: string;
  url: string;
}

interface Props {
  open: boolean;
  otaPackage?: OtaPackage | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function OtaUpdateDialog({ open, otaPackage, onClose, onSaved }: Props) {
  const isEdit = !!otaPackage;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profiles, setProfiles] = useState<DeviceProfileInfo[]>([]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { title: '', version: '', tag: '', type: 'FIRMWARE', deviceProfileId: '', url: '' },
  });

  useEffect(() => {
    if (open) {
      deviceProfileApi.getDeviceProfileInfos({ page: 0, pageSize: 100, sortProperty: 'name', sortOrder: 'ASC' })
        .then((r) => setProfiles(r.data))
        .catch(() => {});
      reset({
        title: otaPackage?.title || '',
        version: otaPackage?.version || '',
        tag: otaPackage?.tag || '',
        type: otaPackage?.type || 'FIRMWARE',
        deviceProfileId: otaPackage?.deviceProfileId?.id || '',
        url: otaPackage?.url || '',
      });
    }
  }, [open, otaPackage, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await otaUpdateApi.saveOtaPackageInfo({
        ...(otaPackage || {}),
        title: data.title,
        version: data.version,
        tag: data.tag || undefined,
        type: data.type,
        deviceProfileId: data.deviceProfileId ? { id: data.deviceProfileId, entityType: 'DEVICE_PROFILE' } : undefined,
        url: data.url || undefined,
      });
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save OTA package');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit OTA Package' : 'Add OTA Package'}</DialogTitle>
      {loading && <LinearProgress />}
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Controller name="title" control={control} rules={{ required: 'Title is required' }}
            render={({ field }) => <TextField {...field} label="Title" fullWidth margin="normal" error={!!errors.title} helperText={errors.title?.message} autoFocus />} />
          <Controller name="version" control={control} rules={{ required: 'Version is required' }}
            render={({ field }) => <TextField {...field} label="Version" fullWidth margin="normal" error={!!errors.version} helperText={errors.version?.message} disabled={isEdit} />} />
          <Controller name="type" control={control}
            render={({ field }) => (
              <TextField {...field} select label="Package Type" fullWidth margin="normal" disabled={isEdit}>
                <MenuItem value="FIRMWARE">Firmware</MenuItem>
                <MenuItem value="SOFTWARE">Software</MenuItem>
              </TextField>
            )} />
          <Controller name="deviceProfileId" control={control}
            render={({ field }) => (
              <TextField {...field} select label="Device Profile" fullWidth margin="normal" disabled={isEdit}>
                <MenuItem value="">None</MenuItem>
                {profiles.map((p) => (
                  <MenuItem key={p.id.id} value={p.id.id}>{p.name}</MenuItem>
                ))}
              </TextField>
            )} />
          <Controller name="tag" control={control}
            render={({ field }) => <TextField {...field} label="Tag" fullWidth margin="normal" />} />
          <Controller name="url" control={control}
            render={({ field }) => <TextField {...field} label="Direct URL" fullWidth margin="normal" helperText="Optional: direct URL to package file" />} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>{isEdit ? 'Save' : 'Add'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
