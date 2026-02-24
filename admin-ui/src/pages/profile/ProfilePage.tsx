import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import { authApi } from '@/api/auth.api';
import { userApi } from '@/api/user.api';
import { useAppSelector } from '@/store/store';
import { selectUserDetails, selectAuthority } from '@/store/auth.slice';
import { Authority } from '@/models/authority.model';

interface ProfileFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const userDetails = useAppSelector(selectUserDetails);
  const authority = useAppSelector(selectAuthority);

  const { control: profileControl, handleSubmit: handleProfileSubmit, reset: resetProfile } = useForm<ProfileFormData>({
    defaultValues: { email: '', firstName: '', lastName: '', phone: '' },
  });

  const { control: pwControl, handleSubmit: handlePwSubmit, reset: resetPw, watch } = useForm<PasswordFormData>({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    authApi.getUser()
      .then((user) => {
        resetProfile({
          email: user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phone: user.phone || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [resetProfile]);

  const onSaveProfile = async (data: ProfileFormData) => {
    if (!userDetails) return;
    setSavingProfile(true);
    setError('');
    setSuccess('');
    try {
      await userApi.saveUser({
        ...userDetails,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });
      setSuccess('Profile saved successfully');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (data: PasswordFormData) => {
    setSavingPassword(true);
    setError('');
    setSuccess('');
    try {
      await authApi.changePassword(data.currentPassword, data.newPassword);
      setSuccess('Password changed successfully');
      resetPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  }

  const authorityLabel = authority === Authority.SYS_ADMIN ? 'System Administrator'
    : authority === Authority.TENANT_ADMIN ? 'Tenant Administrator'
    : 'Customer User';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 500 }}>Profile</Typography>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Profile Info */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6">Account Information</Typography>
          <Chip label={authorityLabel} size="small" color="primary" variant="outlined" />
        </Box>

        {userDetails?.additionalInfo?.lastLoginTs && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Last login: {new Date(userDetails.additionalInfo.lastLoginTs).toLocaleString()}
          </Typography>
        )}

        <form onSubmit={handleProfileSubmit(onSaveProfile)}>
          <Controller name="email" control={profileControl} rules={{ required: 'Email is required' }}
            render={({ field, fieldState }) => (
              <TextField {...field} label="Email" fullWidth size="small" margin="normal" type="email"
                error={!!fieldState.error} helperText={fieldState.error?.message} />
            )} />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Controller name="firstName" control={profileControl}
              render={({ field }) => (
                <TextField {...field} label="First Name" fullWidth size="small" margin="normal" />
              )} />
            <Controller name="lastName" control={profileControl}
              render={({ field }) => (
                <TextField {...field} label="Last Name" fullWidth size="small" margin="normal" />
              )} />
          </Box>

          <Controller name="phone" control={profileControl}
            render={({ field }) => (
              <TextField {...field} label="Phone" fullWidth size="small" margin="normal" />
            )} />

          <Box sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={savingProfile} size="small">
              Save Profile
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Change Password */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LockIcon fontSize="small" />
          <Typography variant="h6">Change Password</Typography>
        </Box>

        <form onSubmit={handlePwSubmit(onChangePassword)}>
          <Controller name="currentPassword" control={pwControl} rules={{ required: 'Current password is required' }}
            render={({ field, fieldState }) => (
              <TextField {...field} label="Current Password" fullWidth size="small" margin="normal" type="password"
                error={!!fieldState.error} helperText={fieldState.error?.message} />
            )} />

          <Divider sx={{ my: 1 }} />

          <Controller name="newPassword" control={pwControl}
            rules={{
              required: 'New password is required',
              minLength: { value: 6, message: 'Min 6 characters' },
            }}
            render={({ field, fieldState }) => (
              <TextField {...field} label="New Password" fullWidth size="small" margin="normal" type="password"
                error={!!fieldState.error} helperText={fieldState.error?.message} />
            )} />

          <Controller name="confirmPassword" control={pwControl}
            rules={{
              required: 'Please confirm password',
              validate: (val) => val === watch('newPassword') || 'Passwords do not match',
            }}
            render={({ field, fieldState }) => (
              <TextField {...field} label="Confirm New Password" fullWidth size="small" margin="normal" type="password"
                error={!!fieldState.error} helperText={fieldState.error?.message} />
            )} />

          <Box sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" color="warning" startIcon={<LockIcon />} disabled={savingPassword} size="small">
              Change Password
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
