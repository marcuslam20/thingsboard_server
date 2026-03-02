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
import Link from '@mui/material/Link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { DeviceProfile } from '@/models/device.model';
import { ProductCategory } from '@/models/datapoint.model';
import { deviceProfileApi } from '@/api/device-profile.api';
import { smartHomeProductApi } from '@/api/smarthome-product.api';
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
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [pidCopied, setPidCopied] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    setLoading(true);
    deviceProfileApi.getDeviceProfile(profileId)
      .then((p) => {
        setProfile(p);
        if (p.categoryId?.id) {
          smartHomeProductApi.getCategory(p.categoryId.id)
            .then(setCategory)
            .catch(() => setCategory(null));
        }
      })
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

  const isDeveloping = !profile?.default;
  const categoryName = category?.name || profile?.type || 'Common Device';

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
          {/* Back + Title + Change Product */}
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
            <Link
              component="button"
              variant="body2"
              sx={{
                color: tuyaColors.info, fontSize: '12px', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 0.25, cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Change Product
              <SwapVertIcon sx={{ fontSize: 14 }} />
            </Link>
          </Box>

          {/* Meta info row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 4.5, flexWrap: 'wrap' }}>
            {/* Custom badge */}
            <Chip
              label="Custom"
              size="small"
              sx={{
                height: 20, fontSize: '11px', fontWeight: 500,
                bgcolor: 'rgba(0,139,213,0.08)', color: tuyaColors.info,
                borderRadius: '4px',
              }}
            />

            {/* PID */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: tuyaColors.textHint }}>
                PID: {profileId.substring(0, 16)}
              </Typography>
              <IconButton size="small" onClick={handleCopyPid} sx={{ p: 0.25 }}>
                <ContentCopyIcon sx={{ fontSize: 13, color: pidCopied ? tuyaColors.success : tuyaColors.textHint }} />
              </IconButton>
            </Box>

            <Typography variant="caption" sx={{ color: tuyaColors.textHint }}>|</Typography>

            {/* Category */}
            <Typography variant="caption" sx={{ color: tuyaColors.textHint }}>
              Category: {categoryName}
            </Typography>

            <Typography variant="caption" sx={{ color: tuyaColors.textHint }}>|</Typography>

            {/* Protocol */}
            <Typography variant="caption" sx={{ color: tuyaColors.textHint }}>
              Protocol: {getTransportLabel(profile)}
            </Typography>

            {/* More + Edit */}
            <Link
              href="#"
              sx={{ fontSize: '12px', color: tuyaColors.info, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              ... More
            </Link>
            <IconButton size="small" sx={{ p: 0.25, color: tuyaColors.info }}>
              <EditOutlinedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Status + Release Product */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 0.5 }}>
          <Chip
            label={isDeveloping ? 'Developing' : 'Completed'}
            size="small"
            sx={{
              bgcolor: isDeveloping ? 'rgba(250,173,20,0.1)' : 'rgba(82,196,26,0.1)',
              color: isDeveloping ? tuyaColors.warning : tuyaColors.success,
              fontWeight: 500,
              '&::before': {
                content: '""',
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: isDeveloping ? tuyaColors.warning : tuyaColors.success,
                display: 'inline-block',
                mr: 0.5,
              },
            }}
          />
          <Button
            variant="contained"
            size="small"
            startIcon={<RocketLaunchOutlinedIcon sx={{ fontSize: 16 }} />}
            sx={{ height: 32, fontSize: '13px' }}
          >
            Release Product
          </Button>
        </Box>
      </Box>

      {/* Tabs + Guide & Task */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${tuyaColors.border}`, mt: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              py: 1,
              px: 3,
              fontSize: '13px',
              minWidth: 140,
            },
            '& .MuiTabs-indicator': {
              backgroundColor: tuyaColors.info,
              height: 2,
            },
          }}
        >
          {TAB_LABELS.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
        <Button
          variant="text"
          size="small"
          startIcon={<MenuBookOutlinedIcon sx={{ fontSize: 16 }} />}
          sx={{
            height: 32, fontSize: '12px', color: tuyaColors.textSecondary,
            '&:hover': { color: tuyaColors.info },
          }}
        >
          Guide & Task
        </Button>
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
