import { useState, useEffect, useCallback } from 'react';
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
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { authApi } from '@/api/auth.api';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const COUNTRIES = [
  'Vietnam', 'China', 'United States', 'Japan', 'South Korea', 'India',
  'Thailand', 'Singapore', 'Malaysia', 'Indonesia', 'Philippines',
  'Germany', 'France', 'United Kingdom', 'Australia', 'Canada', 'Brazil',
];

const COUNTDOWN_SECONDS = 60;

interface SignupForm {
  email: string;
  verificationCode: string;
  password: string;
  confirmPassword: string;
  organizationName: string;
  country: string;
}

export default function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);

  const { register, handleSubmit, watch, formState: { errors }, getValues } = useForm<SignupForm>({
    defaultValues: { country: 'Vietnam' },
  });
  const password = watch('password');

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = useCallback(async () => {
    const email = getValues('email');
    if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(email)) {
      setError(t('signup.email-invalid'));
      return;
    }
    setSendingCode(true);
    setError('');
    setSuccess('');
    try {
      await authApi.sendSignupVerificationCode(email);
      setCountdown(COUNTDOWN_SECONDS);
      setSuccess(t('signup.code-sent'));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || t('signup.code-send-failed');
      setError(msg.includes('already been registered') ? t('signup.email-already-registered') : msg);
    } finally {
      setSendingCode(false);
    }
  }, [getValues, t]);

  const onSubmit = async (data: SignupForm) => {
    if (!agreeTerms || !agreeAge) {
      setError('Please agree to the terms and age confirmation');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await authApi.signup({
        email: data.email,
        verificationCode: data.verificationCode,
        password: data.password,
        companyName: data.organizationName,
        country: data.country,
      });
      setSuccess(t('signup.success'));
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left Panel — Branding (same as LoginPage) */}
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

      {/* Right Panel — Signup Form */}
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
          overflowY: 'auto',
        }}
      >
        {/* Language selector (top-right) */}
        <Box sx={{ position: 'absolute', top: 20, right: 28 }}>
          <LanguageSwitcher />
        </Box>

        <Box sx={{ width: '100%', maxWidth: 420 }}>
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 500,
              color: '#272e3b',
              mb: 3,
              textAlign: 'left',
            }}
          >
            {t('signup.title')}
          </Typography>

          {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 1 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <Typography sx={{ fontSize: 12, color: '#666', mb: 0.5 }}>
              {t('signup.email')} <Box component="span" sx={{ color: 'red' }}>*</Box>
            </Typography>
            <TextField
              {...register('email', {
                required: t('signup.email-required'),
                pattern: { value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i, message: t('signup.email-invalid') },
              })}
              placeholder="Email"
              fullWidth
              size="small"
              error={!!errors.email}
              helperText={errors.email?.message}
              sx={{ mb: 2 }}
            />

            {/* Verification Code */}
            <Typography sx={{ fontSize: 12, color: '#666', mb: 0.5 }}>
              {t('signup.verification-code')} <Box component="span" sx={{ color: 'red' }}>*</Box>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                {...register('verificationCode', { required: t('signup.code-required') })}
                placeholder={t('signup.verification-code')}
                size="small"
                error={!!errors.verificationCode}
                helperText={errors.verificationCode?.message}
                sx={{ flex: 1 }}
              />
              <Button
                variant="text"
                disabled={countdown > 0 || sendingCode}
                onClick={handleSendCode}
                sx={{
                  minWidth: 160,
                  fontSize: 12,
                  color: countdown > 0 ? '#999' : '#008BD5',
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  border: '1px solid',
                  borderColor: countdown > 0 ? '#ddd' : '#008BD5',
                  borderRadius: '4px',
                  '&:hover': { bgcolor: 'rgba(0,139,213,0.04)' },
                  '&.Mui-disabled': { color: '#999', borderColor: '#ddd' },
                }}
              >
                {sendingCode
                  ? '...'
                  : countdown > 0
                    ? t('signup.resend-after', { seconds: countdown })
                    : t('signup.get-code')}
              </Button>
            </Box>

            {/* Password */}
            <Typography sx={{ fontSize: 12, color: '#666', mb: 0.5 }}>
              {t('signup.password')} <Box component="span" sx={{ color: 'red' }}>*</Box>
            </Typography>
            <TextField
              {...register('password', { required: t('signup.password-required') })}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('signup.password')}
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
              sx={{ mb: 2 }}
            />

            {/* Confirm Password */}
            <Typography sx={{ fontSize: 12, color: '#666', mb: 0.5 }}>
              {t('signup.confirm-password')} <Box component="span" sx={{ color: 'red' }}>*</Box>
            </Typography>
            <TextField
              {...register('confirmPassword', {
                required: t('signup.confirm-password-required'),
                validate: (value) => value === password || t('signup.password-mismatch'),
              })}
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder={t('signup.confirm-password')}
              fullWidth
              size="small"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                      {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {/* Organization Name */}
            <Typography sx={{ fontSize: 12, color: '#666', mb: 0.5 }}>
              {t('signup.organization-name')} <Box component="span" sx={{ color: 'red' }}>*</Box>
            </Typography>
            <TextField
              {...register('organizationName', { required: t('signup.organization-required') })}
              placeholder={t('signup.organization-name')}
              fullWidth
              size="small"
              error={!!errors.organizationName}
              helperText={errors.organizationName?.message}
              sx={{ mb: 2 }}
            />

            {/* Country/Region */}
            <Typography sx={{ fontSize: 12, color: '#666', mb: 0.5 }}>
              {t('signup.country-region')}
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <Select
                {...register('country')}
                defaultValue="Vietnam"
              >
                {COUNTRIES.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Terms checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  size="small"
                  sx={{ color: '#ccc', '&.Mui-checked': { color: '#FF4D00' } }}
                />
              }
              label={
                <Typography sx={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>
                  {t('signup.agree-terms')
                    .replace(/<terms>|<\/terms>|<legal>|<\/legal>|<privacy>|<\/privacy>|<compliance>|<\/compliance>/g, '')}
                </Typography>
              }
              sx={{ mb: 0.5, alignItems: 'flex-start', ml: 0 }}
            />

            {/* Age checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreeAge}
                  onChange={(e) => setAgreeAge(e.target.checked)}
                  size="small"
                  sx={{ color: '#ccc', '&.Mui-checked': { color: '#FF4D00' } }}
                />
              }
              label={
                <Typography sx={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>
                  {t('signup.age-confirm')}
                </Typography>
              }
              sx={{ mb: 2.5, alignItems: 'flex-start', ml: 0 }}
            />

            {/* Submit button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || !agreeTerms || !agreeAge}
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
              {t('signup.next')}
            </Button>

            {/* Return to login */}
            <Box sx={{ textAlign: 'center' }}>
              <Link
                component={RouterLink}
                to="/login"
                sx={{ fontSize: 12, color: '#008BD5', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                {t('signup.return-to-login')}
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
