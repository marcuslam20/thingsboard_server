import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useForm } from 'react-hook-form';
import { authApi } from '@/api/auth.api';
import { setTokens } from '@/api/client';
import { useAppDispatch } from '@/store/store';
import { loadUser } from '@/store/auth.slice';

interface CreatePasswordForm {
  password: string;
  confirmPassword: string;
}

export default function CreatePasswordPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const activateToken = searchParams.get('activateToken') || '';
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm<CreatePasswordForm>();
  const password = watch('password');

  if (!activateToken) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#305680' }}>
        <Card sx={{ width: '100%', maxWidth: 450, mx: 2 }} elevation={8}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" color="error" gutterBottom>Invalid Link</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>The activation link is invalid or has expired.</Typography>
            <Button variant="contained" onClick={() => navigate('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const onSubmit = async (data: CreatePasswordForm) => {
    setLoading(true);
    setError('');
    try {
      const response = await authApi.activateUser(activateToken, data.password);
      setTokens(response.token, response.refreshToken);
      await dispatch(loadUser()).unwrap();
      navigate('/home', { replace: true });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const msg = e.response?.data?.message || '';
      if (msg.includes('expired') || msg.includes('invalid')) {
        navigate('/activationLinkExpired', { replace: true });
      } else {
        setError(msg || 'Failed to create password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#305680' }}>
      <Card sx={{ width: '100%', maxWidth: 450, mx: 2 }} elevation={8}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>ThingsBoard</Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>Create Password</Typography>
          </Box>

          {loading && <LinearProgress color="secondary" sx={{ mb: 1 }} />}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
              label="Password"
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
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match',
              })}
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
              }}
            />

            <Button type="submit" variant="contained" color="secondary" fullWidth size="large" disabled={loading} sx={{ mt: 2 }}>
              Create Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
