import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { login, selectRequires2FA, selectRequiresForce2FA } from '@/store/auth.slice';
import { useTranslation } from 'react-i18next';

interface LoginForm {
  username: string;
  password: string;
}

export default function LoginPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requires2FA = useAppSelector(selectRequires2FA);
  const requiresForce2FA = useAppSelector(selectRequiresForce2FA);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  useEffect(() => {
    if (requires2FA) navigate('/login/mfa', { replace: true });
    else if (requiresForce2FA) navigate('/login/force-mfa', { replace: true });
  }, [requires2FA, requiresForce2FA, navigate]);

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError('');
    try {
      const result = await dispatch(login(data)).unwrap();
      if (!result.requires2FA && !result.requiresForce2FA) {
        navigate('/home');
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : t('login.invalid-credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#305680',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 450, mx: 2 }} elevation={8}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              ThingsBoard
            </Typography>
          </Box>

          {loading && <LinearProgress color="secondary" sx={{ mb: 1 }} />}
          {!loading && <Box sx={{ height: 4, mb: 1 }} />}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              {...register('username', {
                required: t('signup.email-required'),
                pattern: { value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i, message: t('signup.email-invalid') },
              })}
              label={t('login.username')}
              fullWidth
              margin="normal"
              error={!!errors.username}
              helperText={errors.username?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>
                ),
              }}
            />

            <TextField
              {...register('password', { required: t('signup.password-required') })}
              label={t('login.password')}
              type={showPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ textAlign: 'right', mb: 2 }}>
              <Link component={RouterLink} to="/resetPassword" variant="body2">
                {t('login.forgot-password')}
              </Link>
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="secondary"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {t('login.login')}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" component="span">
                {t('login.no-account')}{' '}
              </Typography>
              <Link component={RouterLink} to="/signup" variant="body2">
                {t('login.signup')}
              </Link>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
