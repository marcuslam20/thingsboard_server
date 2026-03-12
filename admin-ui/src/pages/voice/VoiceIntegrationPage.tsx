import { useState, useEffect, useCallback } from 'react';
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
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DeviceProfile } from '@/models/device.model';
import { DataPoint, DpMode } from '@/models/datapoint.model';
import { deviceProfileApi, DeviceProfileInfo } from '@/api/device-profile.api';
import { deviceApi } from '@/api/device.api';
import { smartHomeProductApi } from '@/api/smarthome-product.api';
import { voiceApi, AlexaDeviceConfig } from '@/api/voice.api';
import api from '@/api/client';
import { tuyaColors } from '@/theme/theme';

function resolveImagePath(image: string | undefined | null): string | null {
  if (!image) return null;
  if (image.startsWith('tb-image;')) return image.substring('tb-image;'.length);
  if (image.startsWith('tb-image:')) {
    const ref = image.substring('tb-image:'.length);
    return `/api/images/${ref}`;
  }
  return image;
}

function AuthImage({ src, size = 36 }: { src: string; size?: number }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoke: string | null = null;
    api.get(src, { responseType: 'blob' })
      .then((res) => {
        const url = URL.createObjectURL(res.data);
        revoke = url;
        setBlobUrl(url);
      })
      .catch(() => setBlobUrl(null));
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [src]);

  if (!blobUrl) return null;
  return (
    <Box
      component="img"
      src={blobUrl}
      alt="Product"
      sx={{ width: size, height: size, objectFit: 'contain', borderRadius: '6px' }}
    />
  );
}

/** Platform definition */
interface VoicePlatformRow {
  id: string;
  name: string;
  iconSrc: string;
  status: 'no_solution' | 'configuring' | 'released';
  releasedCount: number;
  supported: boolean;
}

/** DP codes that map to voice features — must match VoiceSolutionConfigPage */
const VOICE_FEATURE_DP_CODES: { id: string; dpCodes: string[] }[] = [
  { id: 'power_onoff', dpCodes: ['switch', 'switch_led', 'switch_1', 'control'] },
  { id: 'brightness', dpCodes: ['bright_value', 'bright_value_v2', 'brightness'] },
  { id: 'color', dpCodes: ['colour_data', 'colour_data_v2'] },
  { id: 'color_temperature', dpCodes: ['temp_value', 'temp_value_v2', 'colour_temp'] },
  { id: 'open_close', dpCodes: ['control', 'curtain_control', 'mach_operate'] },
  { id: 'percentage', dpCodes: ['percent_control', 'position', 'percent_state'] },
  { id: 'temperature_setting', dpCodes: ['temp_set', 'temperature_set', 'set_temp'] },
  { id: 'mode_setting', dpCodes: ['mode', 'work_mode'] },
  { id: 'lock_unlock', dpCodes: ['switch_lock', 'lock', 'child_lock'] },
  { id: 'continue_pause', dpCodes: ['pause', 'switch_go'] },
];

/** Count supported voice features by evaluating real DataPoints */
function countSupportedFeatures(dataPoints: DataPoint[]): number {
  const writableCodes = new Set(
    dataPoints.filter((dp) => dp.mode !== DpMode.RO).map((dp) => dp.code)
  );
  return VOICE_FEATURE_DP_CODES.filter((f) =>
    f.dpCodes.some((code) => writableCodes.has(code))
  ).length;
}

/** localStorage key for tracking "configuring" state */
function getConfiguringKey(profileId: string, platformId: string): string {
  return `voice_configuring_${profileId}_${platformId}`;
}

function isConfiguring(profileId: string, platformId: string): boolean {
  return localStorage.getItem(getConfiguringKey(profileId, platformId)) === 'true';
}

function setConfiguring(profileId: string, platformId: string, value: boolean): void {
  if (value) {
    localStorage.setItem(getConfiguringKey(profileId, platformId), 'true');
  } else {
    localStorage.removeItem(getConfiguringKey(profileId, platformId));
  }
}

export default function VoiceIntegrationPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [profileInfos, setProfileInfos] = useState<DeviceProfileInfo[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(searchParams.get('profileId') || '');
  const [selectedProfile, setSelectedProfile] = useState<DeviceProfile | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // Voice state per platform
  const [platforms, setPlatforms] = useState<VoicePlatformRow[]>([]);
  const [loadingVoice, setLoadingVoice] = useState(false);

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

  // Load full profile + voice status when selection changes
  const loadVoiceStatus = useCallback(async (profileId: string) => {
    if (!profileId) return;
    setLoadingVoice(true);

    try {
      const profile = await deviceProfileApi.getDeviceProfile(profileId);
      setSelectedProfile(profile);

      // Load category name
      if (profile.categoryId?.id) {
        try {
          const cat = await smartHomeProductApi.getCategory(profile.categoryId.id);
          setCategoryName(cat.name);
        } catch { setCategoryName(''); }
      } else {
        setCategoryName('');
      }

      // Get devices belonging to this profile to check voice status
      const devicesResult = await deviceApi.getTenantDeviceInfos(
        { page: 0, pageSize: 100, sortProperty: 'name', sortOrder: 'ASC' },
        undefined,
        profileId
      );

      // Check if any device has alexa enabled
      let alexaStatus: 'no_solution' | 'configuring' | 'released' = 'no_solution';
      let alexaCount = 0;

      try {
        const alexaDevices: AlexaDeviceConfig[] = await voiceApi.getAlexaDevices();
        const profileDeviceIds = new Set(devicesResult.data.map((d) => d.id.id));
        const matchedDevices = alexaDevices.filter((ad) => profileDeviceIds.has(ad.id));
        const enabledDevices = matchedDevices.filter((ad) => ad.alexaCapabilities?.enabled);

        if (enabledDevices.length > 0) {
          alexaStatus = 'released';
          // Count features based on real DataPoints
          try {
            const dps = await smartHomeProductApi.getDataPoints(profileId);
            alexaCount = countSupportedFeatures(dps);
          } catch {
            alexaCount = enabledDevices.length; // fallback
          }
          // Clear configuring state since it's now released
          setConfiguring(profileId, 'alexa', false);
        } else if (isConfiguring(profileId, 'alexa')) {
          alexaStatus = 'configuring';
        }
      } catch {
        // Alexa API might not be available
        if (isConfiguring(profileId, 'alexa')) {
          alexaStatus = 'configuring';
        }
      }

      // TODO: Similar logic for Google Assistant
      let googleStatus: 'no_solution' | 'configuring' | 'released' = 'no_solution';
      if (isConfiguring(profileId, 'google_assistant')) {
        googleStatus = 'configuring';
      }

      setPlatforms([
        {
          id: 'alexa',
          name: 'Alexa',
          iconSrc: '/alexa-icon.png',
          status: alexaStatus,
          releasedCount: alexaCount,
          supported: true,
        },
        {
          id: 'google_assistant',
          name: 'Google Assistant',
          iconSrc: '/google-assistants-icon.png',
          status: googleStatus,
          releasedCount: 0,
          supported: true,
        },
        {
          id: 'smartthings',
          name: 'SmartThings',
          iconSrc: '',
          status: 'no_solution',
          releasedCount: 0,
          supported: false,
        },
      ]);
    } catch {
      setSelectedProfile(null);
    } finally {
      setLoadingVoice(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedProfileId) return;
    setSearchParams({ profileId: selectedProfileId }, { replace: true });
    loadVoiceStatus(selectedProfileId);
  }, [selectedProfileId, setSearchParams, loadVoiceStatus]);

  const handleCancelActivation = async (platformId: string) => {
    if (!selectedProfileId) return;
    try {
      const devicesResult = await deviceApi.getTenantDeviceInfos(
        { page: 0, pageSize: 100, sortProperty: 'name', sortOrder: 'ASC' },
        undefined,
        selectedProfileId
      );
      const deviceIds = devicesResult.data.map((d) => d.id.id);
      await voiceApi.configureAlexaForProfile(deviceIds, false, 'SWITCH');
      setConfiguring(selectedProfileId, platformId, false);
      loadVoiceStatus(selectedProfileId);
    } catch (err) {
      console.error('Failed to cancel activation:', err);
    }
  };

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
              {(() => {
                const imgPath = resolveImagePath(selectedProfile?.image);
                return imgPath ? (
                  <Box sx={{ width: 48, height: 48, flexShrink: 0 }}>
                    <AuthImage src={imgPath} size={48} />
                  </Box>
                ) : (
                  <Box sx={{
                    width: 48, height: 48, borderRadius: '6px', bgcolor: '#F5F7FA',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${tuyaColors.border}`, flexShrink: 0,
                  }}>
                    <DevicesOtherIcon sx={{ fontSize: 24, color: tuyaColors.textHint }} />
                  </Box>
                );
              })()}
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
                  {loadingVoice ? (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress size={24} sx={{ color: tuyaColors.orange }} />
                      </TableCell>
                    </TableRow>
                  ) : (
                    platforms.map((platform) => (
                      <TableRow key={platform.id} hover>
                        {/* Platform Name */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {platform.iconSrc ? (
                                <img src={platform.iconSrc} alt={platform.name} style={{ width: 28, height: 28 }} />
                              ) : (
                                <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#15BDB2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Typography sx={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>S</Typography>
                                </Box>
                              )}
                            </Box>
                            <Typography sx={{ fontSize: '13px', fontWeight: 500, color: tuyaColors.textPrimary }}>
                              {platform.name}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Developing */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {platform.status === 'released' || platform.status === 'configuring' ? (
                              <>
                                <Typography sx={{ fontSize: '12px', color: tuyaColors.textSecondary }}>Configuring...</Typography>
                                <Button
                                  variant="contained"
                                  size="small"
                                  sx={{ height: 24, fontSize: '11px', px: 1.5 }}
                                  onClick={() => navigate(`/voice/integration/${platform.id}/config?profileId=${selectedProfileId}&mode=edit`)}
                                >
                                  Continue
                                </Button>
                              </>
                            ) : (
                              <>
                                <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint }}>No solution</Typography>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  disabled={!platform.supported}
                                  onClick={() => {
                                    setConfiguring(selectedProfileId, platform.id, true);
                                    navigate(`/voice/integration/${platform.id}/config?profileId=${selectedProfileId}&mode=edit`);
                                  }}
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
                          {platform.releasedCount > 0 ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CheckCircleIcon sx={{ fontSize: 14, color: tuyaColors.success }} />
                              <Link
                                component="button"
                                onClick={() => navigate(`/voice/integration/${platform.id}/config?profileId=${selectedProfileId}&mode=released`)}
                                sx={{ fontSize: '12px', color: tuyaColors.info, textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                              >
                                {platform.releasedCount} Voice Feature(s) &gt;
                              </Link>
                            </Box>
                          ) : (
                            <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint }}>&mdash;</Typography>
                          )}
                        </TableCell>

                        {/* Operation */}
                        <TableCell sx={{ textAlign: 'right' }}>
                          {platform.status === 'released' ? (
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                              <Link
                                component="button"
                                onClick={() => handleCancelActivation(platform.id)}
                                sx={{ color: tuyaColors.info, fontSize: '12px', textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                              >
                                Cancel Activation
                              </Link>
                              <Link
                                component="button"
                                onClick={() => navigate(`/voice/integration/${platform.id}/config?profileId=${selectedProfileId}&mode=released`)}
                                sx={{ color: tuyaColors.info, fontSize: '12px', textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                              >
                                Manage Versions
                              </Link>
                            </Box>
                          ) : platform.supported && platform.status === 'configuring' ? (
                            <Link
                              component="button"
                              sx={{ color: tuyaColors.info, fontSize: '12px', textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                            >
                              Manage Versions
                            </Link>
                          ) : (
                            <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint }}>&mdash;</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontSize: '12px', color: tuyaColors.textHint }}>
              Currently supported voice platforms: <strong>Amazon Alexa</strong> and <strong>Google Assistant</strong>.
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}
