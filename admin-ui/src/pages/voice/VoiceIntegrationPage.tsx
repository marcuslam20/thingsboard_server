import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DeviceProfile } from '@/models/device.model';
import { deviceProfileApi, DeviceProfileInfo } from '@/api/device-profile.api';
import { smartHomeProductApi } from '@/api/smarthome-product.api';
import { tuyaColors } from '@/theme/theme';

// Voice platform definitions
interface VoicePlatform {
  id: string;
  name: string;
  icon: string; // emoji placeholder — replace with real icons later
  iconColor: string;
  developing: 'configuring' | 'no_solution' | 'configured';
  released: number; // voice features count, 0 = none
  supported: boolean; // whether our backend supports this platform
}

const VOICE_PLATFORMS: VoicePlatform[] = [
  {
    id: 'alexa',
    name: 'Alexa',
    icon: '\u{1F535}', // blue circle
    iconColor: '#00CAFF',
    developing: 'configuring',
    released: 0,
    supported: true,
  },
  {
    id: 'google_assistant',
    name: 'Google Assistant',
    icon: '\u{1F7E1}', // yellow circle
    iconColor: '#FBBC04',
    developing: 'no_solution',
    released: 0,
    supported: true,
  },
  {
    id: 'smartthings',
    name: 'SmartThings',
    icon: '\u{1F537}', // blue diamond
    iconColor: '#15BDB2',
    developing: 'no_solution',
    released: 0,
    supported: false,
  },
];

export default function VoiceIntegrationPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Profile list + selection
  const [profileInfos, setProfileInfos] = useState<DeviceProfileInfo[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(searchParams.get('profileId') || '');
  const [selectedProfile, setSelectedProfile] = useState<DeviceProfile | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // Load profiles on mount
  useEffect(() => {
    setLoadingProfiles(true);
    deviceProfileApi.getDeviceProfileInfos({ page: 0, pageSize: 100, sortProperty: 'name', sortOrder: 'ASC' })
      .then((result) => {
        setProfileInfos(result.data);
        if (!selectedProfileId && result.data.length > 0) {
          setSelectedProfileId(result.data[0].id.id);
        }
      })
      .catch(() => setProfileInfos([]))
      .finally(() => setLoadingProfiles(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load full profile + category when selection changes
  useEffect(() => {
    if (!selectedProfileId) return;
    setSearchParams({ profileId: selectedProfileId }, { replace: true });

    deviceProfileApi.getDeviceProfile(selectedProfileId)
      .then((profile) => {
        setSelectedProfile(profile);
        if (profile.categoryId?.id) {
          smartHomeProductApi.getCategory(profile.categoryId.id)
            .then((cat) => setCategoryName(cat.name))
            .catch(() => setCategoryName(''));
        } else {
          setCategoryName('');
        }
      })
      .catch(() => setSelectedProfile(null));
  }, [selectedProfileId, setSearchParams]);

  if (loadingProfiles) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: tuyaColors.orange }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 0.5 }}>
        <Typography variant="h5" sx={{ mb: 0.5 }}>Voice Platform Integration</Typography>
        <Typography variant="body2" sx={{ color: tuyaColors.textSecondary, fontSize: '13px', mb: 0.5 }}>
          Select a voice platform and customize voice features to quickly make your product voice-enabled.
        </Typography>
        <Link href="#" sx={{ fontSize: '12px', color: tuyaColors.info, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
          How-To Guide
        </Link>
      </Box>

      {/* Separator */}
      <Box sx={{ borderBottom: `1px solid ${tuyaColors.border}`, mb: 2.5, mt: 1 }} />

      {profileInfos.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <DevicesOtherIcon sx={{ fontSize: 48, color: tuyaColors.textHint, mb: 1, display: 'block', mx: 'auto' }} />
          <Typography variant="body2" sx={{ color: tuyaColors.textHint }}>
            No products found. Create a product (Device Profile) first.
          </Typography>
        </Box>
      ) : (
        <>
          {/* Product Card */}
          <Paper elevation={0} sx={{ border: `1px solid ${tuyaColors.border}`, borderRadius: 1, p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: 1, bgcolor: '#F5F5F5',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <DevicesOtherIcon sx={{ fontSize: 24, color: tuyaColors.textHint }} />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: tuyaColors.textPrimary }}>
                    {selectedProfile?.name || 'Select a product'}
                  </Typography>
                  <Select
                    size="small"
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    variant="standard"
                    sx={{ fontSize: '12px', color: tuyaColors.info, '&:before': { display: 'none' }, '&:after': { display: 'none' } }}
                    disableUnderline
                  >
                    {profileInfos.map((pi) => (
                      <MenuItem key={pi.id.id} value={pi.id.id} sx={{ fontSize: '12px' }}>
                        {pi.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
                <Typography sx={{ fontSize: '11px', color: tuyaColors.textHint }}>
                  Custom
                  {selectedProfile && <> | PID: {selectedProfileId.substring(0, 16)}</>}
                  {categoryName && <> | Category: {categoryName}</>}
                  {selectedProfile?.transportType && <> | Protocol Type: {selectedProfile.transportType}</>}
                </Typography>
              </Box>

              <Link
                component="button"
                onClick={() => selectedProfileId && navigate(`/profiles/deviceProfiles/${selectedProfileId}`)}
                sx={{
                  fontSize: '12px', color: tuyaColors.info, textDecoration: 'none', cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }, flexShrink: 0,
                }}
              >
                View Product Features
              </Link>
            </Box>
          </Paper>

          {/* Voice Solution Configuration */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500, color: tuyaColors.textPrimary }}>
              Voice Solution Configuration
            </Typography>
            <Button
              variant="outlined"
              sx={{ height: 32, fontSize: '12px', px: 2, color: tuyaColors.textPrimary, borderColor: tuyaColors.border }}
            >
              Export Voice Command
            </Button>
          </Box>

          {/* Voice Platforms Table */}
          <Paper elevation={0} sx={{ border: `1px solid ${tuyaColors.border}`, borderRadius: 1 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '25%' }}>Platform Name</TableCell>
                    <TableCell sx={{ width: '30%' }}>Developing</TableCell>
                    <TableCell sx={{ width: '25%' }}>Released</TableCell>
                    <TableCell sx={{ width: '20%', textAlign: 'right' }}>Operation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {VOICE_PLATFORMS.map((platform) => (
                    <TableRow key={platform.id} hover>
                      {/* Platform Name */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{
                            width: 32, height: 32, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: platform.id === 'alexa' ? '#E6FBFF' :
                                     platform.id === 'google_assistant' ? '#FFF8E6' : '#E6FFF8',
                          }}>
                            {platform.id === 'alexa' && (
                              <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#00CAFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography sx={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>A</Typography>
                              </Box>
                            )}
                            {platform.id === 'google_assistant' && (
                              <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#FBBC04', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography sx={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>G</Typography>
                              </Box>
                            )}
                            {platform.id === 'smartthings' && (
                              <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#15BDB2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography sx={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>S</Typography>
                              </Box>
                            )}
                          </Box>
                          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: tuyaColors.textPrimary }}>
                            {platform.name}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Developing status */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {platform.developing === 'configuring' ? (
                            <>
                              <Typography sx={{ fontSize: '12px', color: tuyaColors.textSecondary }}>Configuring...</Typography>
                              <Button
                                variant="contained"
                                size="small"
                                sx={{ height: 24, fontSize: '11px', px: 1.5 }}
                              >
                                Continue
                              </Button>
                            </>
                          ) : platform.developing === 'configured' ? (
                            <>
                              <CheckCircleIcon sx={{ fontSize: 16, color: tuyaColors.success }} />
                              <Typography sx={{ fontSize: '12px', color: tuyaColors.success }}>Configured</Typography>
                            </>
                          ) : (
                            <>
                              <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint }}>No solution</Typography>
                              <Button
                                variant="outlined"
                                size="small"
                                disabled={!platform.supported}
                                sx={{
                                  height: 24, fontSize: '11px', px: 1.5,
                                  color: platform.supported ? tuyaColors.info : tuyaColors.textHint,
                                  borderColor: platform.supported ? tuyaColors.info : tuyaColors.border,
                                }}
                              >
                                Create Solution
                              </Button>
                            </>
                          )}
                        </Box>
                      </TableCell>

                      {/* Released */}
                      <TableCell>
                        {platform.released > 0 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CheckCircleIcon sx={{ fontSize: 14, color: tuyaColors.success }} />
                            <Link
                              component="button"
                              sx={{ fontSize: '12px', color: tuyaColors.info, textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                            >
                              {platform.released} Voice Feature(s)
                            </Link>
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint }}>—</Typography>
                        )}
                      </TableCell>

                      {/* Operation */}
                      <TableCell sx={{ textAlign: 'right' }}>
                        {platform.supported && (platform.developing === 'configuring' || platform.developing === 'configured') ? (
                          <Link
                            component="button"
                            sx={{ color: tuyaColors.info, fontSize: '12px', textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          >
                            Manage Versions
                          </Link>
                        ) : platform.supported ? (
                          <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint }}>—</Typography>
                        ) : (
                          <Chip label="Not Supported" size="small" sx={{ fontSize: '10px', height: 20, color: tuyaColors.textHint }} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Info note */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontSize: '12px', color: tuyaColors.textHint }}>
              Currently supported voice platforms: <strong>Amazon Alexa</strong> and <strong>Google Assistant</strong>.
              Integration is managed through the Alexa Skill Lambda and Google Cloud Function deployed alongside this platform.
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}
