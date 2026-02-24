import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import { adminApi, AdminSettings, MailSettings } from '@/api/admin.api';

interface MailFormData {
  mailFrom: string;
  smtpProtocol: string;
  smtpHost: string;
  smtpPort: number;
  timeout: number;
  enableTls: boolean;
  tlsVersion: string;
  enableProxy: boolean;
  proxyHost: string;
  proxyPort: number;
  proxyUser: string;
  proxyPassword: string;
  username: string;
  password: string;
  enableOauth2: boolean;
  clientId: string;
  clientSecret: string;
}

export default function MailServerTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mailSettings, setMailSettings] = useState<AdminSettings<MailSettings> | null>(null);

  const { control, handleSubmit, reset, watch } = useForm<MailFormData>({
    defaultValues: {
      mailFrom: '',
      smtpProtocol: 'smtp',
      smtpHost: '',
      smtpPort: 25,
      timeout: 10000,
      enableTls: false,
      tlsVersion: 'TLSv1.2',
      enableProxy: false,
      proxyHost: '',
      proxyPort: 0,
      proxyUser: '',
      proxyPassword: '',
      username: '',
      password: '',
      enableOauth2: false,
      clientId: '',
      clientSecret: '',
    },
  });

  const enableTls = watch('enableTls');
  const enableProxy = watch('enableProxy');
  const enableOauth2 = watch('enableOauth2');

  useEffect(() => {
    adminApi.getMailSettings()
      .then((settings) => {
        setMailSettings(settings);
        const v = settings.jsonValue;
        reset({
          mailFrom: v.mailFrom || '',
          smtpProtocol: v.smtpProtocol || 'smtp',
          smtpHost: v.smtpHost || '',
          smtpPort: v.smtpPort || 25,
          timeout: v.timeout || 10000,
          enableTls: v.enableTls || false,
          tlsVersion: v.tlsVersion || 'TLSv1.2',
          enableProxy: v.enableProxy || false,
          proxyHost: v.proxyHost || '',
          proxyPort: v.proxyPort || 0,
          proxyUser: v.proxyUser || '',
          proxyPassword: v.proxyPassword || '',
          username: v.username || '',
          password: v.password || '',
          enableOauth2: v.enableOauth2 || false,
          clientId: v.clientId || '',
          clientSecret: v.clientSecret || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reset]);

  const buildPayload = (data: MailFormData): AdminSettings<MailSettings> => ({
    ...mailSettings,
    key: 'mail',
    jsonValue: {
      mailFrom: data.mailFrom,
      smtpProtocol: data.smtpProtocol,
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort,
      timeout: data.timeout,
      enableTls: data.enableTls,
      tlsVersion: data.enableTls ? data.tlsVersion : undefined,
      enableProxy: data.enableProxy,
      proxyHost: data.enableProxy ? data.proxyHost : undefined,
      proxyPort: data.enableProxy ? data.proxyPort : undefined,
      proxyUser: data.enableProxy ? data.proxyUser : undefined,
      proxyPassword: data.enableProxy ? data.proxyPassword : undefined,
      username: data.enableOauth2 ? undefined : data.username,
      password: data.enableOauth2 ? undefined : data.password,
      enableOauth2: data.enableOauth2,
      clientId: data.enableOauth2 ? data.clientId : undefined,
      clientSecret: data.enableOauth2 ? data.clientSecret : undefined,
    },
  });

  const onSave = async (data: MailFormData) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const saved = await adminApi.saveAdminSettings(buildPayload(data));
      setMailSettings(saved);
      setSuccess('Mail settings saved successfully');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save mail settings');
    } finally {
      setSaving(false);
    }
  };

  const onTestMail = async (data: MailFormData) => {
    setTesting(true);
    setError('');
    setSuccess('');
    try {
      await adminApi.sendTestMail(buildPayload(data));
      setSuccess('Test email sent successfully');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to send test email');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Mail Server Configuration</Typography>

        <form onSubmit={handleSubmit(onSave)}>
          <Controller
            name="mailFrom"
            control={control}
            rules={{ required: 'Sender email is required' }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Mail From"
                fullWidth
                size="small"
                margin="normal"
                error={!!fieldState.error}
                helperText={fieldState.error?.message || 'Sender email address'}
                type="email"
              />
            )}
          />

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>SMTP Connection</Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
            <Controller
              name="smtpProtocol"
              control={control}
              render={({ field }) => (
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Protocol</InputLabel>
                  <Select {...field} label="Protocol">
                    <MenuItem value="smtp">SMTP</MenuItem>
                    <MenuItem value="smtps">SMTPS</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name="smtpHost"
              control={control}
              rules={{ required: 'SMTP host is required' }}
              render={({ field, fieldState }) => (
                <TextField {...field} label="SMTP Host" size="small" sx={{ flex: 1 }} error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}
            />
            <Controller
              name="smtpPort"
              control={control}
              rules={{ required: 'Port is required', min: { value: 1, message: 'Min 1' }, max: { value: 65535, message: 'Max 65535' } }}
              render={({ field, fieldState }) => (
                <TextField {...field} onChange={(e) => field.onChange(Number(e.target.value))} label="Port" type="number" size="small" sx={{ width: 100 }} error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center' }}>
            <Controller
              name="timeout"
              control={control}
              render={({ field }) => (
                <TextField {...field} onChange={(e) => field.onChange(Number(e.target.value))} label="Timeout (ms)" type="number" size="small" sx={{ width: 150 }} />
              )}
            />
            <Controller
              name="enableTls"
              control={control}
              render={({ field }) => (
                <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} size="small" />} label="Enable TLS" />
              )}
            />
            {enableTls && (
              <Controller
                name="tlsVersion"
                control={control}
                render={({ field }) => (
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>TLS Version</InputLabel>
                    <Select {...field} label="TLS Version">
                      <MenuItem value="TLSv1">TLSv1</MenuItem>
                      <MenuItem value="TLSv1.1">TLSv1.1</MenuItem>
                      <MenuItem value="TLSv1.2">TLSv1.2</MenuItem>
                      <MenuItem value="TLSv1.3">TLSv1.3</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            )}
          </Box>

          <Divider sx={{ my: 2 }} />
          <Controller
            name="enableProxy"
            control={control}
            render={({ field }) => (
              <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} size="small" />} label="Enable Proxy" />
            )}
          />

          {enableProxy && (
            <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
              <Controller name="proxyHost" control={control} render={({ field }) => <TextField {...field} label="Proxy Host" size="small" sx={{ flex: 1, minWidth: 150 }} />} />
              <Controller name="proxyPort" control={control} render={({ field }) => <TextField {...field} onChange={(e) => field.onChange(Number(e.target.value))} label="Proxy Port" type="number" size="small" sx={{ width: 100 }} />} />
              <Controller name="proxyUser" control={control} render={({ field }) => <TextField {...field} label="Proxy User" size="small" sx={{ flex: 1, minWidth: 150 }} />} />
              <Controller name="proxyPassword" control={control} render={({ field }) => <TextField {...field} label="Proxy Password" type="password" size="small" sx={{ flex: 1, minWidth: 150 }} />} />
            </Box>
          )}

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Authentication</Typography>

          <Controller
            name="enableOauth2"
            control={control}
            render={({ field }) => (
              <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} size="small" />} label="Use OAuth2" />
            )}
          />

          {enableOauth2 ? (
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Controller name="clientId" control={control} render={({ field }) => <TextField {...field} label="Client ID" size="small" sx={{ flex: 1 }} />} />
              <Controller name="clientSecret" control={control} render={({ field }) => <TextField {...field} label="Client Secret" size="small" type="password" sx={{ flex: 1 }} />} />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Controller name="username" control={control} render={({ field }) => <TextField {...field} label="Username" size="small" sx={{ flex: 1 }} />} />
              <Controller name="password" control={control} render={({ field }) => <TextField {...field} label="Password" type="password" size="small" sx={{ flex: 1 }} />} />
            </Box>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving} size="small">
              Save
            </Button>
            <Button
              variant="outlined"
              startIcon={testing ? <CircularProgress size={16} /> : <SendIcon />}
              disabled={testing}
              onClick={handleSubmit(onTestMail)}
              size="small"
            >
              Send Test Mail
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
