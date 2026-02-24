import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import SaveIcon from '@mui/icons-material/Save';
import { adminApi, AdminSettings, GeneralSettings, ConnectivitySettings, ConnectivityProtocol } from '@/api/admin.api';

interface ConnectivityFormData {
  http: ConnectivityProtocol;
  https: ConnectivityProtocol;
  mqtt: ConnectivityProtocol;
  mqtts: ConnectivityProtocol;
  coap: ConnectivityProtocol;
  coaps: ConnectivityProtocol;
}

export default function GeneralSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generalSettings, setGeneralSettings] = useState<AdminSettings<GeneralSettings> | null>(null);
  const [connectivitySettings, setConnectivitySettings] = useState<AdminSettings<ConnectivitySettings> | null>(null);

  const { control: generalControl, handleSubmit: handleGeneralSubmit, reset: resetGeneral } = useForm<GeneralSettings>({
    defaultValues: { baseUrl: '', prohibitDifferentUrl: false },
  });

  const { control: connectivityControl, handleSubmit: handleConnectivitySubmit, reset: resetConnectivity, watch } = useForm<ConnectivityFormData>({
    defaultValues: {
      http: { enabled: true, host: 'localhost', port: 8080 },
      https: { enabled: false, host: 'localhost', port: 443 },
      mqtt: { enabled: true, host: 'localhost', port: 1883 },
      mqtts: { enabled: false, host: 'localhost', port: 8883 },
      coap: { enabled: true, host: 'localhost', port: 5683 },
      coaps: { enabled: false, host: 'localhost', port: 5684 },
    },
  });

  useEffect(() => {
    Promise.all([
      adminApi.getGeneralSettings().catch(() => null),
      adminApi.getConnectivitySettings().catch(() => null),
    ]).then(([general, connectivity]) => {
      if (general) {
        setGeneralSettings(general);
        resetGeneral(general.jsonValue);
      }
      if (connectivity) {
        setConnectivitySettings(connectivity);
        resetConnectivity(connectivity.jsonValue);
      }
    }).finally(() => setLoading(false));
  }, [resetGeneral, resetConnectivity]);

  const onSaveGeneral = async (data: GeneralSettings) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload: AdminSettings<GeneralSettings> = {
        ...generalSettings,
        key: 'general',
        jsonValue: data,
      };
      const saved = await adminApi.saveAdminSettings(payload);
      setGeneralSettings(saved);
      setSuccess('General settings saved successfully');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save general settings');
    } finally {
      setSaving(false);
    }
  };

  const onSaveConnectivity = async (data: ConnectivityFormData) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload: AdminSettings<ConnectivitySettings> = {
        ...connectivitySettings,
        key: 'connectivity',
        jsonValue: data,
      };
      const saved = await adminApi.saveAdminSettings(payload);
      setConnectivitySettings(saved);
      setSuccess('Connectivity settings saved successfully');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save connectivity settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  }

  const protocols = [
    { key: 'http' as const, label: 'HTTP' },
    { key: 'https' as const, label: 'HTTPS' },
    { key: 'mqtt' as const, label: 'MQTT' },
    { key: 'mqtts' as const, label: 'MQTTS' },
    { key: 'coap' as const, label: 'CoAP' },
    { key: 'coaps' as const, label: 'CoAPS' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {/* General Settings */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>General Settings</Typography>
        <form onSubmit={handleGeneralSubmit(onSaveGeneral)}>
          <Controller
            name="baseUrl"
            control={generalControl}
            rules={{ required: 'Base URL is required' }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Base URL"
                fullWidth
                size="small"
                margin="normal"
                error={!!fieldState.error}
                helperText={fieldState.error?.message || 'Base URL of the ThingsBoard instance'}
                placeholder="http://localhost:8080"
              />
            )}
          />
          <Controller
            name="prohibitDifferentUrl"
            control={generalControl}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={!!field.value} onChange={field.onChange} />}
                label="Prohibit different URL"
              />
            )}
          />
          <Box sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving} size="small">
              Save
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Device Connectivity */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Device Connectivity</Typography>
        <form onSubmit={handleConnectivitySubmit(onSaveConnectivity)}>
          {protocols.map((proto, idx) => {
            const enabled = watch(`${proto.key}.enabled`);
            return (
              <Box key={proto.key}>
                {idx > 0 && <Divider sx={{ my: 1.5 }} />}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Controller
                    name={`${proto.key}.enabled`}
                    control={connectivityControl}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch checked={field.value} onChange={field.onChange} size="small" />}
                        label={proto.label}
                        sx={{ minWidth: 100 }}
                      />
                    )}
                  />
                  <Controller
                    name={`${proto.key}.host`}
                    control={connectivityControl}
                    render={({ field }) => (
                      <TextField {...field} label="Host" size="small" disabled={!enabled} sx={{ flex: 1 }} />
                    )}
                  />
                  <Controller
                    name={`${proto.key}.port`}
                    control={connectivityControl}
                    rules={{ min: { value: 1, message: 'Min 1' }, max: { value: 65535, message: 'Max 65535' } }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        label="Port"
                        type="number"
                        size="small"
                        disabled={!enabled}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        sx={{ width: 100 }}
                      />
                    )}
                  />
                </Box>
              </Box>
            );
          })}
          <Box sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving} size="small">
              Save
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
