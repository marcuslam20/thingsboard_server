import { useEffect, useState } from 'react';
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
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Tooltip from '@mui/material/Tooltip';
import { DeviceCredentials, DeviceCredentialsType } from '@/models/device.model';
import { deviceApi } from '@/api/device.api';

interface DeviceCredentialsDialogProps {
  open: boolean;
  deviceId: string;
  onClose: () => void;
}

export default function DeviceCredentialsDialog({ open, deviceId, onClose }: DeviceCredentialsDialogProps) {
  const [credentials, setCredentials] = useState<DeviceCredentials | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [credentialsType, setCredentialsType] = useState<DeviceCredentialsType>(DeviceCredentialsType.ACCESS_TOKEN);
  const [credentialsId, setCredentialsId] = useState('');
  const [credentialsValue, setCredentialsValue] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && deviceId) {
      setLoading(true);
      setError('');
      setSuccess('');
      deviceApi.getDeviceCredentials(deviceId)
        .then((creds) => {
          setCredentials(creds);
          setCredentialsType(creds.credentialsType);
          setCredentialsId(creds.credentialsId || '');
          setCredentialsValue(creds.credentialsValue || '');
        })
        .catch(() => setError('Failed to load credentials'))
        .finally(() => setLoading(false));
    }
  }, [open, deviceId]);

  const handleSave = async () => {
    if (!credentials) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await deviceApi.saveDeviceCredentials({
        ...credentials,
        credentialsType,
        credentialsId,
        credentialsValue: credentialsValue || undefined,
      });
      setCredentials(updated);
      setSuccess('Credentials saved successfully');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Device Credentials</DialogTitle>
      {(loading || saving) && <LinearProgress />}
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <FormControl fullWidth margin="normal">
          <InputLabel>Credentials type</InputLabel>
          <Select
            value={credentialsType}
            label="Credentials type"
            onChange={(e) => setCredentialsType(e.target.value as DeviceCredentialsType)}
          >
            <MenuItem value={DeviceCredentialsType.ACCESS_TOKEN}>Access Token</MenuItem>
            <MenuItem value={DeviceCredentialsType.X509_CERTIFICATE}>X.509 Certificate</MenuItem>
            <MenuItem value={DeviceCredentialsType.MQTT_BASIC}>MQTT Basic</MenuItem>
            <MenuItem value={DeviceCredentialsType.LWM2M_CREDENTIALS}>LwM2M Credentials</MenuItem>
          </Select>
        </FormControl>

        {credentialsType === DeviceCredentialsType.ACCESS_TOKEN && (
          <TextField
            label="Access token"
            value={credentialsId}
            onChange={(e) => setCredentialsId(e.target.value)}
            fullWidth
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={copied ? 'Copied!' : 'Copy'}>
                    <IconButton onClick={() => handleCopy(credentialsId)} size="small">
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        )}

        {credentialsType === DeviceCredentialsType.X509_CERTIFICATE && (
          <TextField
            label="RSA public key or X509 Certificate"
            value={credentialsValue}
            onChange={(e) => setCredentialsValue(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={6}
          />
        )}

        {credentialsType === DeviceCredentialsType.MQTT_BASIC && (
          <>
            <TextField
              label="Client ID"
              value={credentialsId}
              onChange={(e) => setCredentialsId(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Credentials (JSON)"
              value={credentialsValue}
              onChange={(e) => setCredentialsValue(e.target.value)}
              fullWidth
              margin="normal"
              multiline
              rows={4}
              placeholder='{"clientId": "", "userName": "", "password": ""}'
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading || saving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
