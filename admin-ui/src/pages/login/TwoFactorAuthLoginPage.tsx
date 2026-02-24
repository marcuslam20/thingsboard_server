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
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { selectRequires2FA, complete2FA, clearAuth } from '@/store/auth.slice';
import { authApi } from '@/api/auth.api';
import { setTokens } from '@/api/client';
import { TwoFaProviderInfo, TwoFactorAuthProviderType } from '@/models/two-factor-auth.model';

export default function TwoFactorAuthLoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const requires2FA = useAppSelector(selectRequires2FA);
  const [providers, setProviders] = useState<TwoFaProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<TwoFactorAuthProviderType | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!requires2FA) {
      navigate('/login', { replace: true });
      return;
    }
    authApi.getAvailableTwoFaProviders().then((p) => {
      setProviders(p);
      const defaultProvider = p.find((pr) => pr.useByDefault) || p[0];
      if (defaultProvider) setSelectedProvider(defaultProvider.type);
    }).catch(() => {
      setError('Failed to load 2FA providers');
    });
  }, [requires2FA, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!selectedProvider) return;
    try {
      await authApi.requestTwoFaVerificationCodeSend(selectedProvider);
      setCountdown(60);
    } catch {
      setError('Failed to send verification code');
    }
  };

  const handleVerify = async () => {
    if (!selectedProvider || !code) return;
    setLoading(true);
    setError('');
    try {
      const response = await authApi.checkTwoFaVerificationCode(selectedProvider, code);
      setTokens(response.token, response.refreshToken);
      await dispatch(complete2FA()).unwrap();
      navigate('/home', { replace: true });
    } catch {
      setError('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    dispatch(clearAuth());
    navigate('/login', { replace: true });
  };

  const needsSend = selectedProvider === TwoFactorAuthProviderType.SMS || selectedProvider === TwoFactorAuthProviderType.EMAIL;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#305680' }}>
      <Card sx={{ width: '100%', maxWidth: 450, mx: 2 }} elevation={8}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>ThingsBoard</Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>Two-Factor Authentication</Typography>
          </Box>

          {loading && <LinearProgress color="secondary" sx={{ mb: 1 }} />}

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {providers.length > 1 && (
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
              <ToggleButtonGroup
                value={selectedProvider}
                exclusive
                onChange={(_, val) => { if (val) { setSelectedProvider(val); setCode(''); setError(''); } }}
                size="small"
              >
                {providers.map((p) => (
                  <ToggleButton key={p.type} value={p.type}>{p.type}</ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          )}

          {needsSend && (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleSendCode}
                disabled={countdown > 0}
                size="small"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Send Code'}
              </Button>
            </Box>
          )}

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
            sx={{ mt: 2, mb: 1 }}
          >
            Verify
          </Button>

          <Button variant="text" fullWidth onClick={handleCancel} sx={{ mt: 1 }}>
            Cancel
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
