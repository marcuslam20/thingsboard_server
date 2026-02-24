import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinkOffIcon from '@mui/icons-material/LinkOff';

export default function LinkExpiredPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActivation = location.pathname.includes('activation');
  const title = isActivation ? 'Activation Link Expired' : 'Password Reset Link Expired';
  const message = isActivation
    ? 'Your account activation link has expired. Please contact your administrator to request a new activation link.'
    : 'Your password reset link has expired. Please request a new password reset link.';

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#305680' }}>
      <Card sx={{ width: '100%', maxWidth: 450, mx: 2 }} elevation={8}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <LinkOffIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{message}</Typography>
          {!isActivation && (
            <Button variant="contained" color="secondary" onClick={() => navigate('/resetPassword')} sx={{ mr: 1 }}>
              Request New Link
            </Button>
          )}
          <Button variant="outlined" onClick={() => navigate('/login')}>
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
