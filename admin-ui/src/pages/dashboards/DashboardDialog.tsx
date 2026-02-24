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
import { Dashboard, createEmptyDashboardConfig } from '@/models/dashboard.model';
import { dashboardApi } from '@/api/dashboard.api';

interface DashboardFormData {
  title: string;
  description: string;
  showTitle: boolean;
}

interface DashboardDialogProps {
  open: boolean;
  dashboard?: Dashboard | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function DashboardDialog({ open, dashboard, onClose, onSaved }: DashboardDialogProps) {
  const isEdit = !!dashboard;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { control, handleSubmit, reset, formState: { errors } } = useForm<DashboardFormData>({
    defaultValues: {
      title: '',
      description: '',
      showTitle: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (dashboard) {
        reset({
          title: dashboard.title || '',
          description: dashboard.configuration?.description || '',
          showTitle: dashboard.configuration?.settings?.showTitle !== false,
        });
      } else {
        reset({ title: '', description: '', showTitle: true });
      }
      setError('');
    }
  }, [open, dashboard, reset]);

  const onSubmit = async (data: DashboardFormData) => {
    setLoading(true);
    setError('');
    try {
      const config = dashboard?.configuration || createEmptyDashboardConfig();
      const payload: Partial<Dashboard> = {
        ...(dashboard || {}),
        title: data.title,
        configuration: {
          ...config,
          description: data.description,
          settings: {
            ...config.settings,
            showTitle: data.showTitle,
          },
        },
      };
      await dashboardApi.saveDashboard(payload);
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Dashboard' : 'Add Dashboard'}</DialogTitle>
      {loading && <LinearProgress />}
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Controller
            name="title"
            control={control}
            rules={{ required: 'Dashboard title is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Title"
                fullWidth
                margin="normal"
                error={!!errors.title}
                helperText={errors.title?.message}
                autoFocus
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

          <Controller
            name="showTitle"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox checked={field.value} onChange={field.onChange} />}
                label="Show title"
                sx={{ mt: 1 }}
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
