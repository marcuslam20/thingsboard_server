import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import SaveIcon from '@mui/icons-material/Save';
import { adminApi, NotificationSettings } from '@/api/admin.api';
import { useAppSelector } from '@/store/store';
import { selectAuthority } from '@/store/auth.slice';
import { Authority } from '@/models/authority.model';

interface NotificationsFormData {
  slackBotToken: string;
  firebaseCredentials: string;
  firebaseFileName: string;
}

export default function NotificationsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const authority = useAppSelector(selectAuthority);
  const isSysAdmin = authority === Authority.SYS_ADMIN;

  const { control, handleSubmit, reset } = useForm<NotificationsFormData>({
    defaultValues: {
      slackBotToken: '',
      firebaseCredentials: '',
      firebaseFileName: '',
    },
  });

  useEffect(() => {
    adminApi.getNotificationSettings()
      .then((settings) => {
        reset({
          slackBotToken: settings.deliveryMethodsConfigs?.SLACK?.botToken || '',
          firebaseCredentials: settings.deliveryMethodsConfigs?.MOBILE_APP?.firebaseServiceAccountCredentials || '',
          firebaseFileName: settings.deliveryMethodsConfigs?.MOBILE_APP?.firebaseServiceAccountCredentialsFileName || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reset]);

  const onSave = async (data: NotificationsFormData) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload: NotificationSettings = {
        deliveryMethodsConfigs: {
          SLACK: { botToken: data.slackBotToken || undefined },
          MOBILE_APP: {
            firebaseServiceAccountCredentials: data.firebaseCredentials || undefined,
            firebaseServiceAccountCredentialsFileName: data.firebaseFileName || undefined,
          },
        },
      };
      await adminApi.saveNotificationSettings(payload);
      setSuccess('Notification settings saved successfully');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}

      <form onSubmit={handleSubmit(onSave)}>
        {/* Slack Integration */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Slack Integration</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure Slack bot token for sending notifications via Slack.
          </Typography>
          <Controller
            name="slackBotToken"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Slack Bot Token"
                fullWidth
                size="small"
                placeholder="xoxb-..."
                helperText="Bot User OAuth Token from your Slack App"
              />
            )}
          />
        </Paper>

        {/* Mobile Push Notifications */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Mobile Push Notifications (FCM)</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure Firebase Cloud Messaging for mobile push notifications.
          </Typography>
          <Controller
            name="firebaseFileName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Service Account File Name"
                fullWidth
                size="small"
                margin="normal"
                helperText="Name of the Firebase service account JSON file"
              />
            )}
          />
          <Controller
            name="firebaseCredentials"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Firebase Service Account Credentials (JSON)"
                fullWidth
                size="small"
                margin="normal"
                multiline
                rows={6}
                placeholder='{"type": "service_account", ...}'
                helperText="Paste the contents of your Firebase service account JSON file"
              />
            )}
          />
        </Paper>

        {isSysAdmin && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              SMS provider settings are configured at the system level.
              Go to the ThingsBoard configuration file to set up SMS providers (Twilio, AWS SNS, etc.).
            </Typography>
          </>
        )}

        <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving} size="small">
          Save
        </Button>
      </form>
    </Box>
  );
}
