/*
 * Copyright © 2016-2025 The Thingsboard Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { login, selectRequires2FA, selectRequiresForce2FA } from '@/store/auth.slice';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

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
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left Panel — Branding */}
      <Box
        sx={{
          width: { xs: 0, md: '32%' },
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'flex-end',
          bgcolor: '#0A0A0A',
          p: 4,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Logo top-left */}
        <Box sx={{ position: 'absolute', top: 18, left: 20, display: 'flex', alignItems: 'baseline', gap: 0.8 }}>
          <Box
            component="img"
            src="/osprey-logo.svg"
            alt="Osprey"
            sx={{ height: 28, position: 'relative', top: 4 }}
          />
          <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 400, opacity: 0.7 }}>
            {t('login.developer-platform')}
          </Typography>
        </Box>

        {/* Abstract artwork background */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,139,213,0.3) 0%, rgba(32,42,107,0.2) 50%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '35%',
            left: '45%',
            transform: 'translate(-50%, -50%) rotate(45deg)',
            width: 200,
            height: 200,
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(30deg)',
            width: 250,
            height: 250,
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 2,
          }}
        />

        {/* Tagline */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            sx={{
              color: '#FFFFFF',
              fontSize: { md: 26, lg: 32 },
              fontWeight: 700,
              lineHeight: 1.2,
              mb: 1,
            }}
          >
            {t('login.tagline-1')}{' '}
            <br />
            {t('login.tagline-2')}{' '}
            <Box component="span" sx={{ color: '#FF4D4F', fontStyle: 'italic' }}>
              {t('login.tagline-3')}
            </Box>
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, mt: 2, maxWidth: 360 }}>
            {t('login.tagline-desc')}
          </Typography>
        </Box>

        {/* Footer */}
        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 500, mt: 4 }}>
          &copy;{new Date().getFullYear()} Osprey IoT Platform
        </Typography>
      </Box>

      {/* Right Panel — Login Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#FFFFFF',
          px: { xs: 3, sm: 6 },
          py: 4,
          position: 'relative',
        }}
      >
        {/* Language selector (top-right) */}
        <Box sx={{ position: 'absolute', top: 20, right: 28 }}>
          <LanguageSwitcher />
        </Box>

        <Box sx={{ width: '100%', maxWidth: 380 }}>
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 500,
              color: '#272e3b',
              mb: 3.5,
              textAlign: 'left',
            }}
          >
            {t('login.title')}
          </Typography>

          {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Typography sx={{ fontSize: 12, color: '#666', mb: 0.5 }}>
              {t('login.account-label')}
            </Typography>
            <TextField
              {...register('username', {
                required: t('signup.email-required'),
                pattern: { value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i, message: t('signup.email-invalid') },
              })}
              placeholder={t('login.username')}
              fullWidth
              size="small"
              error={!!errors.username}
              helperText={errors.username?.message}
              sx={{ mb: 2.5 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography sx={{ fontSize: 12, color: '#666' }}>
                {t('login.password')}
              </Typography>
              <Link
                component={RouterLink}
                to="/resetPassword"
                sx={{ fontSize: 12, color: '#008BD5', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                {t('login.forgot-password')}
              </Link>
            </Box>
            <TextField
              {...register('password', { required: t('signup.password-required') })}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('login.password')}
              fullWidth
              size="small"
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                bgcolor: '#FF4D00',
                color: '#fff',
                textTransform: 'none',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: '4px',
                py: 0.8,
                mb: 2,
                '&:hover': { bgcolor: '#E64500' },
                '&.Mui-disabled': { bgcolor: '#FFB088', color: '#fff' },
              }}
            >
              {t('login.login')}
            </Button>

            <Box sx={{ textAlign: 'left' }}>
              <Link
                component={RouterLink}
                to="/signup"
                sx={{ fontSize: 12, color: '#008BD5', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                {t('login.signup')}
              </Link>
            </Box>
          </form>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
          }}
        >
          <Typography sx={{ color: '#aaa', fontSize: 12, fontWeight: 500 }}>
            &copy;{new Date().getFullYear()} Osprey IoT
          </Typography>
          <Typography sx={{ color: '#aaa', fontSize: 12, fontWeight: 500 }}>
            Time zone: GMT+7
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
