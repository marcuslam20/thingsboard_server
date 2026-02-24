import { useState } from 'react';
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
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import ApartmentIcon from '@mui/icons-material/Apartment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { authApi } from '@/api/auth.api';
import { useTranslation } from 'react-i18next';

const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

interface SignupForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  tenantId: string;
}

export default function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupForm>();
  const password = watch('password');

  const onSubmit = async (data: SignupForm) => {
    setLoading(true);
    setError('');
    try {
      await authApi.signup({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        tenantId: data.tenantId.trim(),
      });
      alert(t('signup.success'));
      navigate('/login');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Signup failed');
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
      <Card sx={{ width: '100%', maxWidth: 450, mx: 2, maxHeight: '90vh', overflow: 'auto' }} elevation={8}>
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
              {...register('firstName', { required: t('signup.first-name-required') })}
              label={t('signup.first-name')}
              fullWidth
              margin="normal"
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
              InputProps={{
                startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment>,
              }}
            />

            <TextField
              {...register('lastName', { required: t('signup.last-name-required') })}
              label={t('signup.last-name')}
              fullWidth
              margin="normal"
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
              InputProps={{
                startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment>,
              }}
            />

            <TextField
              {...register('email', {
                required: t('signup.email-required'),
                pattern: { value: /^\S+@\S+$/i, message: t('signup.email-invalid') },
              })}
              label={t('signup.email')}
              fullWidth
              margin="normal"
              error={!!errors.email}
              helperText={errors.email?.message}
              InputProps={{
                startAdornment: <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>,
              }}
            />

            <TextField
              {...register('password', { required: t('signup.password-required') })}
              label={t('signup.password')}
              type={showPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              {...register('confirmPassword', {
                required: t('signup.password-required'),
                validate: (value) => value === password || t('signup.password-mismatch'),
              })}
              label={t('signup.confirm-password')}
              type={showConfirmPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              {...register('tenantId', {
                required: t('signup.tenant-id-required'),
                pattern: { value: UUID_PATTERN, message: t('signup.tenant-id-invalid') },
              })}
              label={t('signup.tenant-id')}
              fullWidth
              margin="normal"
              error={!!errors.tenantId}
              helperText={errors.tenantId?.message || t('signup.tenant-id-hint')}
              placeholder="e.g. 13814000-1dd2-11b2-8080-808080808080"
              InputProps={{
                startAdornment: <InputAdornment position="start"><ApartmentIcon color="action" /></InputAdornment>,
              }}
            />

            <Button
              type="submit"
              variant="contained"
              color="secondary"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 2, mb: 2 }}
            >
              {t('signup.signup')}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" component="span">
                {t('signup.already-have-account')}{' '}
              </Typography>
              <Link component={RouterLink} to="/login" variant="body2">
                {t('signup.login')}
              </Link>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
