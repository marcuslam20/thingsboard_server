import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import EmailIcon from '@mui/icons-material/Email';
import { authApi } from '@/api/auth.api';
import { useTranslation } from 'react-i18next';

interface ResetForm {
  email: string;
}

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>();

  const onSubmit = async (data: ResetForm) => {
    setLoading(true);
    setError('');
    try {
      await authApi.sendResetPasswordLink(data.email);
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to send reset link');
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
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
              {t('reset-password.title')}
            </Typography>
          </Box>

          {success ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                {t('reset-password.success')}
              </Alert>
              <Box sx={{ textAlign: 'center' }}>
                <Link component={RouterLink} to="/login" variant="body2">
                  {t('reset-password.back-to-login')}
                </Link>
              </Box>
            </>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                {...register('email', {
                  required: t('signup.email-required'),
                  pattern: { value: /^\S+@\S+$/i, message: t('signup.email-invalid') },
                })}
                label={t('reset-password.email')}
                fullWidth
                margin="normal"
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>,
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
                {t('reset-password.send-link')}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Link component={RouterLink} to="/login" variant="body2">
                  {t('reset-password.back-to-login')}
                </Link>
              </Box>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
