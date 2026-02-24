import { useEffect, useState } from 'react';
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
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import SmsIcon from '@mui/icons-material/Sms';
import EmailIcon from '@mui/icons-material/Email';
import KeyIcon from '@mui/icons-material/Key';
import { adminApi, TwoFaSettings, TwoFaProvider } from '@/api/admin.api';

interface ProviderState {
  TOTP: { enable: boolean; issuerName: string };
  SMS: { enable: boolean; smsVerificationMessageTemplate: string; verificationCodeLifetime: number };
  EMAIL: { enable: boolean; verificationCodeLifetime: number };
  BACKUP_CODE: { enable: boolean; codesQuantity: number };
}

export default function TwoFactorAuthTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [totalAllowedTime, setTotalAllowedTime] = useState(120);
  const [minSendPeriod, setMinSendPeriod] = useState(30);
  const [maxFailures, setMaxFailures] = useState(10);
  const [rateLimitEnable, setRateLimitEnable] = useState(false);
  const [rateLimitNumber, setRateLimitNumber] = useState(5);
  const [rateLimitTime, setRateLimitTime] = useState(60);

  const [providers, setProviders] = useState<ProviderState>({
    TOTP: { enable: false, issuerName: 'ThingsBoard' },
    SMS: { enable: false, smsVerificationMessageTemplate: '${code}', verificationCodeLifetime: 120 },
    EMAIL: { enable: false, verificationCodeLifetime: 120 },
    BACKUP_CODE: { enable: false, codesQuantity: 10 },
  });

  useEffect(() => {
    adminApi.getTwoFaSettings()
      .then((settings) => {
        setTotalAllowedTime(settings.totalAllowedTimeForVerification || 120);
        setMinSendPeriod(settings.minVerificationCodeSendPeriod || 30);
        setMaxFailures(settings.maxVerificationFailuresBeforeUserLockout || 10);
        setRateLimitEnable(settings.verificationCodeCheckRateLimitEnable || false);
        setRateLimitNumber(settings.verificationCodeCheckRateLimitNumber || 5);
        setRateLimitTime(settings.verificationCodeCheckRateLimitTime || 60);

        const providerState = { ...providers };
        for (const p of settings.providers || []) {
          if (p.providerType === 'TOTP') {
            providerState.TOTP = { enable: true, issuerName: p.issuerName || 'ThingsBoard' };
          } else if (p.providerType === 'SMS') {
            providerState.SMS = { enable: true, smsVerificationMessageTemplate: p.smsVerificationMessageTemplate || '${code}', verificationCodeLifetime: p.verificationCodeLifetime || 120 };
          } else if (p.providerType === 'EMAIL') {
            providerState.EMAIL = { enable: true, verificationCodeLifetime: p.verificationCodeLifetime || 120 };
          } else if (p.providerType === 'BACKUP_CODE') {
            providerState.BACKUP_CODE = { enable: true, codesQuantity: p.codesQuantity || 10 };
          }
        }
        setProviders(providerState);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateProvider = <K extends keyof ProviderState>(type: K, field: keyof ProviderState[K], value: unknown) => {
    setProviders((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const providerList: TwoFaProvider[] = [];
      if (providers.TOTP.enable) {
        providerList.push({ providerType: 'TOTP', issuerName: providers.TOTP.issuerName });
      }
      if (providers.SMS.enable) {
        providerList.push({
          providerType: 'SMS',
          smsVerificationMessageTemplate: providers.SMS.smsVerificationMessageTemplate,
          verificationCodeLifetime: providers.SMS.verificationCodeLifetime,
        });
      }
      if (providers.EMAIL.enable) {
        providerList.push({ providerType: 'EMAIL', verificationCodeLifetime: providers.EMAIL.verificationCodeLifetime });
      }
      if (providers.BACKUP_CODE.enable) {
        providerList.push({ providerType: 'BACKUP_CODE', codesQuantity: providers.BACKUP_CODE.codesQuantity });
      }

      const settings: TwoFaSettings = {
        providers: providerList,
        totalAllowedTimeForVerification: totalAllowedTime,
        minVerificationCodeSendPeriod: minSendPeriod,
        maxVerificationFailuresBeforeUserLockout: maxFailures,
        verificationCodeCheckRateLimitEnable: rateLimitEnable,
        verificationCodeCheckRateLimitNumber: rateLimitEnable ? rateLimitNumber : undefined,
        verificationCodeCheckRateLimitTime: rateLimitEnable ? rateLimitTime : undefined,
      };
      await adminApi.saveTwoFaSettings(settings);
      setSuccess('2FA settings saved successfully');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save 2FA settings');
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

      {/* Verification Limits */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Verification Limits</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <TextField label="Total Verification Time (sec)" type="number" size="small" value={totalAllowedTime} onChange={(e) => setTotalAllowedTime(Number(e.target.value))} sx={{ flex: 1, minWidth: 200 }} />
          <TextField label="Min Send Period (sec)" type="number" size="small" value={minSendPeriod} onChange={(e) => setMinSendPeriod(Number(e.target.value))} sx={{ flex: 1, minWidth: 180 }} />
          <TextField label="Max Failed Attempts" type="number" size="small" value={maxFailures} onChange={(e) => setMaxFailures(Number(e.target.value))} sx={{ flex: 1, minWidth: 160 }} helperText="0 = unlimited" />
        </Box>
        <FormControlLabel
          control={<Switch checked={rateLimitEnable} onChange={(e) => setRateLimitEnable(e.target.checked)} size="small" />}
          label="Enable rate limiting"
        />
        {rateLimitEnable && (
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <TextField label="Max Check Attempts" type="number" size="small" value={rateLimitNumber} onChange={(e) => setRateLimitNumber(Number(e.target.value))} sx={{ flex: 1 }} />
            <TextField label="Rate Limit Window (sec)" type="number" size="small" value={rateLimitTime} onChange={(e) => setRateLimitTime(Number(e.target.value))} sx={{ flex: 1 }} />
          </Box>
        )}
      </Paper>

      {/* 2FA Providers */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>2FA Providers</Typography>

        {/* TOTP */}
        <Accordion variant="outlined" disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <PhoneAndroidIcon fontSize="small" />
              <Typography sx={{ flex: 1 }}>TOTP (Authenticator App)</Typography>
              <Switch checked={providers.TOTP.enable} onChange={(e) => { e.stopPropagation(); updateProvider('TOTP', 'enable', e.target.checked); }} size="small" onClick={(e) => e.stopPropagation()} />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <TextField label="Issuer Name" size="small" fullWidth value={providers.TOTP.issuerName} onChange={(e) => updateProvider('TOTP', 'issuerName', e.target.value)} disabled={!providers.TOTP.enable} helperText="Displayed in authenticator app" />
          </AccordionDetails>
        </Accordion>

        {/* SMS */}
        <Accordion variant="outlined" disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <SmsIcon fontSize="small" />
              <Typography sx={{ flex: 1 }}>SMS Verification</Typography>
              <Switch checked={providers.SMS.enable} onChange={(e) => { e.stopPropagation(); updateProvider('SMS', 'enable', e.target.checked); }} size="small" onClick={(e) => e.stopPropagation()} />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <TextField label="SMS Template" size="small" fullWidth value={providers.SMS.smsVerificationMessageTemplate} onChange={(e) => updateProvider('SMS', 'smsVerificationMessageTemplate', e.target.value)} disabled={!providers.SMS.enable} helperText="Must contain ${code}" sx={{ mb: 1 }} />
            <TextField label="Code Lifetime (sec)" type="number" size="small" value={providers.SMS.verificationCodeLifetime} onChange={(e) => updateProvider('SMS', 'verificationCodeLifetime', Number(e.target.value))} disabled={!providers.SMS.enable} />
          </AccordionDetails>
        </Accordion>

        {/* Email */}
        <Accordion variant="outlined" disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <EmailIcon fontSize="small" />
              <Typography sx={{ flex: 1 }}>Email Verification</Typography>
              <Switch checked={providers.EMAIL.enable} onChange={(e) => { e.stopPropagation(); updateProvider('EMAIL', 'enable', e.target.checked); }} size="small" onClick={(e) => e.stopPropagation()} />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <TextField label="Code Lifetime (sec)" type="number" size="small" value={providers.EMAIL.verificationCodeLifetime} onChange={(e) => updateProvider('EMAIL', 'verificationCodeLifetime', Number(e.target.value))} disabled={!providers.EMAIL.enable} />
          </AccordionDetails>
        </Accordion>

        {/* Backup Codes */}
        <Accordion variant="outlined" disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <KeyIcon fontSize="small" />
              <Typography sx={{ flex: 1 }}>Backup Codes</Typography>
              <Switch checked={providers.BACKUP_CODE.enable} onChange={(e) => { e.stopPropagation(); updateProvider('BACKUP_CODE', 'enable', e.target.checked); }} size="small" onClick={(e) => e.stopPropagation()} />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <TextField label="Number of Codes" type="number" size="small" value={providers.BACKUP_CODE.codesQuantity} onChange={(e) => updateProvider('BACKUP_CODE', 'codesQuantity', Number(e.target.value))} disabled={!providers.BACKUP_CODE.enable} helperText="How many backup codes to generate" />
          </AccordionDetails>
        </Accordion>
      </Paper>

      <Divider />

      <Button variant="contained" startIcon={<SaveIcon />} disabled={saving} onClick={handleSave} size="small" sx={{ alignSelf: 'flex-start' }}>
        Save 2FA Settings
      </Button>
    </Box>
  );
}
