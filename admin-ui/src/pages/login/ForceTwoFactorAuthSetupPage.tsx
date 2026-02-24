import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { selectRequiresForce2FA, complete2FA, clearAuth } from '@/store/auth.slice';
import { authApi } from '@/api/auth.api';
import { setTokens } from '@/api/client';
import { TwoFactorAuthProviderType, TwoFactorAuthAccountConfig, TotpTwoFaAccountConfig } from '@/models/two-factor-auth.model';

const PROVIDER_ICONS: Record<string, typeof PhoneAndroidIcon> = {
  TOTP: PhoneAndroidIcon,
  SMS: SmsIcon,
  EMAIL: EmailIcon,
};

const PROVIDER_LABELS: Record<string, string> = {
  TOTP: 'Authenticator App',
  SMS: 'SMS Verification',
  EMAIL: 'Email Verification',
};

const steps = ['Choose Method', 'Configure', 'Verify'];

export default function ForceTwoFactorAuthSetupPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const requiresForce2FA = useAppSelector(selectRequiresForce2FA);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedType, setSelectedType] = useState<TwoFactorAuthProviderType | null>(null);
  const [config, setConfig] = useState<TwoFactorAuthAccountConfig | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!requiresForce2FA) {
      navigate('/login', { replace: true });
    }
  }, [requiresForce2FA, navigate]);

  const handleSelectProvider = async (type: TwoFactorAuthProviderType) => {
    setSelectedType(type);
    setLoading(true);
    setError('');
    try {
      const cfg = await authApi.generateTwoFaAccountConfig(type);
      setConfig(cfg);
      setActiveStep(1);
    } catch {
      setError('Failed to generate configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!config || !code) return;
    setLoading(true);
    setError('');
    try {
      await authApi.verifyAndSaveTwoFaAccountConfig(config, code);
      const response = await authApi.login({ username: '', password: '' }).catch(() => null);
      if (response) {
        setTokens(response.token, response.refreshToken);
      }
      await dispatch(complete2FA()).unwrap();
      navigate('/home', { replace: true });
    } catch {
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    dispatch(clearAuth());
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#305680' }}>
      <Card sx={{ width: '100%', maxWidth: 500, mx: 2 }} elevation={8}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>ThingsBoard</Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
              Two-Factor Authentication Setup Required
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>

          {loading && <LinearProgress color="secondary" sx={{ mb: 1 }} />}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {activeStep === 0 && (
            <List>
              {[TwoFactorAuthProviderType.TOTP, TwoFactorAuthProviderType.SMS, TwoFactorAuthProviderType.EMAIL].map((type) => {
                const Icon = PROVIDER_ICONS[type] || PhoneAndroidIcon;
                return (
                  <ListItemButton key={type} onClick={() => handleSelectProvider(type)} sx={{ borderRadius: 1, mb: 1 }}>
                    <ListItemIcon><Icon /></ListItemIcon>
                    <ListItemText primary={PROVIDER_LABELS[type] || type} />
                  </ListItemButton>
                );
              })}
            </List>
          )}

          {activeStep === 1 && config && (
            <Box>
              {selectedType === TwoFactorAuthProviderType.TOTP && (config as TotpTwoFaAccountConfig).authUrl && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Scan this QR code with your authenticator app, or enter the key manually:
                  </Typography>
                  <Box sx={{ textAlign: 'center', my: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      {(config as TotpTwoFaAccountConfig).authUrl}
                    </Typography>
                  </Box>
                </Box>
              )}
              {selectedType !== TwoFactorAuthProviderType.TOTP && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  A verification code will be sent to your registered {selectedType?.toLowerCase()}.
                </Typography>
              )}
              <Button variant="contained" fullWidth onClick={() => setActiveStep(2)}>
                Continue to Verification
              </Button>
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <TextField
                label="Verification Code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                fullWidth
                margin="normal"
                placeholder="Enter 6-digit code"
                inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: 24, letterSpacing: 8 } }}
                autoFocus
              />
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                size="large"
                onClick={handleVerify}
                disabled={loading || code.length < 6}
                sx={{ mt: 2 }}
              >
                Verify & Enable
              </Button>
            </Box>
          )}

          <Button variant="text" fullWidth onClick={handleCancel} sx={{ mt: 2 }}>
            Cancel
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
