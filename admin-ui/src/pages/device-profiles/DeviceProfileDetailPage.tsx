import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { DeviceProfile } from '@/models/device.model';
import { deviceProfileApi } from '@/api/device-profile.api';
import { tuyaColors } from '@/theme/theme';
import FunctionDefinitionTab from './tabs/FunctionDefinitionTab';

function getTransportLabel(profile: DeviceProfile): string {
  switch (profile.transportType) {
    case 'MQTT': return 'Wi-Fi, Bluetooth LE';
    case 'COAP': return 'Bluetooth LE';
    case 'LWM2M': return 'Zigbee 3.0';
    default: return profile.transportType || 'DEFAULT';
  }
}

const TAB_LABELS = [
  'Function Definition',
  'Device Interaction',
  'Hardware Development',
  'Product Configuration',
  'Product Test',
];

export default function DeviceProfileDetailPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<DeviceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [pidCopied, setPidCopied] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    setLoading(true);
    deviceProfileApi.getDeviceProfile(profileId)
      .then(setProfile)
      .catch((err) => console.error('Failed to load profile:', err))
      .finally(() => setLoading(false));
  }, [profileId]);

  const handleCopyPid = () => {
    if (!profileId) return;
    navigator.clipboard.writeText(profileId).then(() => {
      setPidCopied(true);
      setTimeout(() => setPidCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress sx={{ color: tuyaColors.orange }} />
      </Box>
    );
  }

  if (!profile || !profileId) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">Product not found</Typography>
        <Button onClick={() => navigate('/profiles/deviceProfiles')} sx={{ mt: 2 }}>
          Back to Products
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0 }}>
        <Box>
          {/* Back + Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => navigate('/profiles/deviceProfiles')}
              sx={{ color: tuyaColors.orangeDark }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 400 }}>
              {profile.name}
            </Typography>
          </Box>

          {/* Meta info row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 4.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: tuyaColors.textHint }}>
              PID: {profileId.substring(0, 16)}
            </Typography>
            <IconButton size="small" onClick={handleCopyPid} sx={{ p: 0.25 }}>
              <ContentCopyIcon sx={{ fontSize: 14, color: pidCopied ? tuyaColors.success : tuyaColors.textHint }} />
            </IconButton>
            <Typography variant="caption" sx={{ color: tuyaColors.textHint }}>
              Category: {profile.type || 'Common Device'}
            </Typography>
            <Typography variant="caption" sx={{ color: tuyaColors.textHint }}>
              Protocol: {getTransportLabel(profile)}
            </Typography>
          </Box>
        </Box>

        {/* Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: 0.5 }}>
          <Chip
            label="Developing"
            size="small"
            sx={{
              bgcolor: 'rgba(250,173,20,0.1)',
              color: tuyaColors.warning,
              fontWeight: 500,
              '&::before': {
                content: '""',
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: tuyaColors.warning,
                display: 'inline-block',
                mr: 0.5,
              },
            }}
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: `1px solid ${tuyaColors.border}`, mt: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              py: 1,
              px: 2.5,
              fontSize: '13px',
            },
          }}
        >
          {TAB_LABELS.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ pt: 2.5 }}>
        {activeTab === 0 && <FunctionDefinitionTab deviceProfileId={profileId} />}
        {activeTab === 1 && <ComingSoon label="Device Interaction" />}
        {activeTab === 2 && <ComingSoon label="Hardware Development" />}
        {activeTab === 3 && <ComingSoon label="Product Configuration" />}
        {activeTab === 4 && <ComingSoon label="Product Test" />}
      </Box>
    </Box>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h6" sx={{ color: tuyaColors.textHint, fontWeight: 400 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: tuyaColors.textHint, mt: 1 }}>
        Coming soon
      </Typography>
    </Box>
  );
}
