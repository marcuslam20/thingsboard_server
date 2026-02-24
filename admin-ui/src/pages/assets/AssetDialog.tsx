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
import { Asset, assetApi } from '@/api/asset.api';
import api from '@/api/client';

interface AssetProfileOption {
  id: { id: string; entityType: string };
  name: string;
}

interface FormData {
  name: string;
  label: string;
  assetProfileId: string;
  description: string;
}

interface Props {
  open: boolean;
  asset?: Asset | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function AssetDialog({ open, asset, onClose, onSaved }: Props) {
  const isEdit = !!asset;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [assetProfiles, setAssetProfiles] = useState<AssetProfileOption[]>([]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { name: '', label: '', assetProfileId: '', description: '' },
  });

  useEffect(() => {
    if (open) {
      api.get('/api/assetProfileInfos', { params: { pageSize: 100, page: 0 } })
        .then((r) => setAssetProfiles(r.data.data || []))
        .catch(() => {});
      reset({
        name: asset?.name || '',
        label: asset?.label || '',
        assetProfileId: asset?.assetProfileId?.id || '',
        description: (asset?.additionalInfo?.description as string) || '',
      });
    }
  }, [open, asset, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await assetApi.saveAsset({
        ...(asset || {}),
        name: data.name,
        label: data.label,
        assetProfileId: { id: data.assetProfileId, entityType: 'ASSET_PROFILE' },
        additionalInfo: { ...(asset?.additionalInfo || {}), description: data.description },
      });
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
      {loading && <LinearProgress />}
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Controller name="name" control={control} rules={{ required: 'Name is required' }}
            render={({ field }) => <TextField {...field} label="Name" fullWidth margin="normal" error={!!errors.name} helperText={errors.name?.message} autoFocus />} />
          <Controller name="assetProfileId" control={control} rules={{ required: 'Asset profile is required' }}
            render={({ field }) => (
              <TextField {...field} select label="Asset Profile" fullWidth margin="normal" error={!!errors.assetProfileId} helperText={errors.assetProfileId?.message}>
                {assetProfiles.map((p) => (
                  <MenuItem key={p.id.id} value={p.id.id}>{p.name}</MenuItem>
                ))}
              </TextField>
            )} />
          <Controller name="label" control={control}
            render={({ field }) => <TextField {...field} label="Label" fullWidth margin="normal" />} />
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
