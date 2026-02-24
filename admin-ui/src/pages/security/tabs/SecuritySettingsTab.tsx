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
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import SaveIcon from '@mui/icons-material/Save';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { adminApi, SecuritySettings } from '@/api/admin.api';

interface SecurityFormData {
  maxFailedLoginAttempts: number;
  userLockoutNotificationEmail: string;
  userActivationTokenTtl: number;
  passwordResetTokenTtl: number;
  minimumLength: number;
  maximumLength: number;
  minimumUppercaseLetters: number;
  minimumLowercaseLetters: number;
  minimumDigits: number;
  minimumSpecialCharacters: number;
  passwordExpirationPeriodDays: number;
  passwordReuseFrequencyDays: number;
  allowWhitespaces: boolean;
}

interface JwtFormData {
  tokenIssuer: string;
  tokenSigningKey: string;
  tokenExpirationTime: number;
  refreshTokenExpTime: number;
}

export default function SecuritySettingsTab() {
  const [loading, setLoading] = useState(true);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [savingJwt, setSavingJwt] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { control: secControl, handleSubmit: handleSecSubmit, reset: resetSec } = useForm<SecurityFormData>({
    defaultValues: {
      maxFailedLoginAttempts: 0,
      userLockoutNotificationEmail: '',
      userActivationTokenTtl: 24,
      passwordResetTokenTtl: 24,
      minimumLength: 6,
      maximumLength: 72,
      minimumUppercaseLetters: 0,
      minimumLowercaseLetters: 0,
      minimumDigits: 0,
      minimumSpecialCharacters: 0,
      passwordExpirationPeriodDays: 0,
      passwordReuseFrequencyDays: 0,
      allowWhitespaces: true,
    },
  });

  const { control: jwtControl, handleSubmit: handleJwtSubmit, reset: resetJwt, setValue: setJwtValue } = useForm<JwtFormData>({
    defaultValues: {
      tokenIssuer: 'thingsboard.io',
      tokenSigningKey: '',
      tokenExpirationTime: 9000,
      refreshTokenExpTime: 604800,
    },
  });

  useEffect(() => {
    Promise.all([
      adminApi.getSecuritySettings().catch(() => null),
      adminApi.getJwtSettings().catch(() => null),
    ]).then(([sec, jwt]) => {
      if (sec) {
        const pp = sec.passwordPolicy || {};
        resetSec({
          maxFailedLoginAttempts: sec.maxFailedLoginAttempts || 0,
          userLockoutNotificationEmail: sec.userLockoutNotificationEmail || '',
          userActivationTokenTtl: sec.userActivationTokenTtl || 24,
          passwordResetTokenTtl: sec.passwordResetTokenTtl || 24,
          minimumLength: pp.minimumLength || 6,
          maximumLength: pp.maximumLength || 72,
          minimumUppercaseLetters: pp.minimumUppercaseLetters || 0,
          minimumLowercaseLetters: pp.minimumLowercaseLetters || 0,
          minimumDigits: pp.minimumDigits || 0,
          minimumSpecialCharacters: pp.minimumSpecialCharacters || 0,
          passwordExpirationPeriodDays: pp.passwordExpirationPeriodDays || 0,
          passwordReuseFrequencyDays: pp.passwordReuseFrequencyDays || 0,
          allowWhitespaces: pp.allowWhitespaces !== false,
        });
      }
      if (jwt) {
        resetJwt(jwt);
      }
    }).finally(() => setLoading(false));
  }, [resetSec, resetJwt]);

  const onSaveSecurity = async (data: SecurityFormData) => {
    setSavingSecurity(true);
    setError('');
    setSuccess('');
    try {
      const payload: SecuritySettings = {
        maxFailedLoginAttempts: data.maxFailedLoginAttempts,
        userLockoutNotificationEmail: data.userLockoutNotificationEmail || undefined,
        userActivationTokenTtl: data.userActivationTokenTtl,
        passwordResetTokenTtl: data.passwordResetTokenTtl,
        passwordPolicy: {
          minimumLength: data.minimumLength,
          maximumLength: data.maximumLength || undefined,
          minimumUppercaseLetters: data.minimumUppercaseLetters,
          minimumLowercaseLetters: data.minimumLowercaseLetters,
          minimumDigits: data.minimumDigits,
          minimumSpecialCharacters: data.minimumSpecialCharacters,
          passwordExpirationPeriodDays: data.passwordExpirationPeriodDays || undefined,
          passwordReuseFrequencyDays: data.passwordReuseFrequencyDays || undefined,
          allowWhitespaces: data.allowWhitespaces,
        },
      };
      await adminApi.saveSecuritySettings(payload);
      setSuccess('Security settings saved successfully');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save security settings');
    } finally {
      setSavingSecurity(false);
    }
  };

  const onSaveJwt = async (data: JwtFormData) => {
    setSavingJwt(true);
    setError('');
    setSuccess('');
    try {
      await adminApi.saveJwtSettings(data);
      setSuccess('JWT settings saved successfully');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save JWT settings');
    } finally {
      setSavingJwt(false);
    }
  };

  const generateSigningKey = () => {
    const array = new Uint8Array(64);
    crypto.getRandomValues(array);
    const base64 = btoa(String.fromCharCode(...array));
    setJwtValue('tokenSigningKey', base64);
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  }

  const numberField = (name: keyof SecurityFormData, label: string, opts?: { min?: number; max?: number; helperText?: string }) => (
    <Controller
      name={name}
      control={secControl}
      rules={{
        min: opts?.min !== undefined ? { value: opts.min, message: `Min ${opts.min}` } : undefined,
        max: opts?.max !== undefined ? { value: opts.max, message: `Max ${opts.max}` } : undefined,
      }}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          onChange={(e) => field.onChange(Number(e.target.value))}
          label={label}
          type="number"
          size="small"
          sx={{ flex: 1, minWidth: 160 }}
          error={!!fieldState.error}
          helperText={fieldState.error?.message || opts?.helperText}
        />
      )}
    />
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Security Settings */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Security Settings</Typography>
        <form onSubmit={handleSecSubmit(onSaveSecurity)}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            {numberField('maxFailedLoginAttempts', 'Max Failed Login Attempts', { min: 0, helperText: '0 = unlimited' })}
            <Controller
              name="userLockoutNotificationEmail"
              control={secControl}
              render={({ field }) => (
                <TextField {...field} label="Lockout Notification Email" size="small" type="email" sx={{ flex: 1, minWidth: 200 }} />
              )}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            {numberField('userActivationTokenTtl', 'Activation Token TTL (hours)', { min: 1, max: 24 })}
            {numberField('passwordResetTokenTtl', 'Password Reset Token TTL (hours)', { min: 1, max: 24 })}
          </Box>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Password Policy</Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
            {numberField('minimumLength', 'Min Length', { min: 6, max: 50 })}
            {numberField('maximumLength', 'Max Length', { min: 6 })}
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
            {numberField('minimumUppercaseLetters', 'Min Uppercase', { min: 0 })}
            {numberField('minimumLowercaseLetters', 'Min Lowercase', { min: 0 })}
            {numberField('minimumDigits', 'Min Digits', { min: 0 })}
            {numberField('minimumSpecialCharacters', 'Min Special Chars', { min: 0 })}
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
            {numberField('passwordExpirationPeriodDays', 'Password Expiration (days)', { min: 0, helperText: '0 = never' })}
            {numberField('passwordReuseFrequencyDays', 'Reuse Frequency (days)', { min: 0, helperText: '0 = no restriction' })}
          </Box>
          <Controller
            name="allowWhitespaces"
            control={secControl}
            render={({ field }) => (
              <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} size="small" />} label="Allow whitespace in passwords" />
            )}
          />

          <Box sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={savingSecurity} size="small">
              Save Security Settings
            </Button>
          </Box>
        </form>
      </Paper>

      {/* JWT Settings */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>JWT Settings</Typography>
        <form onSubmit={handleJwtSubmit(onSaveJwt)}>
          <Controller
            name="tokenIssuer"
            control={jwtControl}
            rules={{ required: 'Token issuer is required' }}
            render={({ field, fieldState }) => (
              <TextField {...field} label="Token Issuer" fullWidth size="small" margin="normal" error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <Controller
              name="tokenSigningKey"
              control={jwtControl}
              rules={{ required: 'Signing key is required' }}
              render={({ field, fieldState }) => (
                <TextField {...field} label="Token Signing Key (Base64)" fullWidth size="small" margin="normal" error={!!fieldState.error} helperText={fieldState.error?.message || 'Min 64 bytes, base64 encoded'} />
              )}
            />
            <Button variant="outlined" startIcon={<VpnKeyIcon />} onClick={generateSigningKey} size="small" sx={{ mt: 2, whiteSpace: 'nowrap' }}>
              Generate
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Controller
              name="tokenExpirationTime"
              control={jwtControl}
              rules={{ required: 'Required', min: { value: 60, message: 'Min 60s' } }}
              render={({ field, fieldState }) => (
                <TextField {...field} onChange={(e) => field.onChange(Number(e.target.value))} label="Access Token Expiration (sec)" type="number" size="small" sx={{ flex: 1 }} error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}
            />
            <Controller
              name="refreshTokenExpTime"
              control={jwtControl}
              rules={{ required: 'Required', min: { value: 900, message: 'Min 900s' } }}
              render={({ field, fieldState }) => (
                <TextField {...field} onChange={(e) => field.onChange(Number(e.target.value))} label="Refresh Token Expiration (sec)" type="number" size="small" sx={{ flex: 1 }} error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={savingJwt} size="small">
              Save JWT Settings
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
