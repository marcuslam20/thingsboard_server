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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { DeviceProfile } from '@/models/device.model';
import { deviceProfileApi, DeviceProfileInfo } from '@/api/device-profile.api';
import { smartHomeProductApi } from '@/api/smarthome-product.api';
import { otaUpdateApi, OtaPackageInfo } from '@/api/ota-update.api';
import { tuyaColors } from '@/theme/theme';

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString('en-CA');
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${date} ${time}`;
}

export default function FirmwareUpdatePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Profile list + selection
  const [profileInfos, setProfileInfos] = useState<DeviceProfileInfo[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(searchParams.get('profileId') || '');
  const [selectedProfile, setSelectedProfile] = useState<DeviceProfile | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // Firmware packages for selected profile
  const [packages, setPackages] = useState<OtaPackageInfo[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

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

  // Load OTA packages for selected profile
  const loadPackages = useCallback(async () => {
    if (!selectedProfileId) return;
    setLoadingPackages(true);
    try {
      const result = await otaUpdateApi.getOtaPackages(
        selectedProfileId,
        'FIRMWARE',
        { page: 0, pageSize: 50, sortProperty: 'createdTime', sortOrder: 'DESC' },
      );
      setPackages(result.data);
    } catch {
      setPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  }, [selectedProfileId]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

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
        <Typography variant="h5" sx={{ mb: 0.5 }}>Firmware Update</Typography>
        <Typography variant="body2" sx={{ color: tuyaColors.textSecondary, fontSize: '13px', mb: 0.5 }}>
          For the MCU SDK or TuyaOS based devices that have been delivered, you can deploy firmware updates to them over the air (OTA) without flashing firmware.
        </Typography>
        <Link href="#" sx={{ fontSize: '12px', color: tuyaColors.info, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
          View Docs
        </Link>
      </Box>

      {/* Tab: My Updates */}
      <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${tuyaColors.border}`, mb: 2.5, mt: 1 }}>
        <Box
          sx={{
            px: 2, py: 1, cursor: 'pointer', fontSize: '13px', fontWeight: 500,
            color: tuyaColors.info,
            borderBottom: `2px solid ${tuyaColors.info}`,
            mb: '-1px',
          }}
        >
          My Updates
        </Box>
      </Box>

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
          <Paper elevation={0} sx={{ border: `1px solid ${tuyaColors.border}`, borderRadius: 1, p: 2, mb: 2 }}>
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
                  <Link
                    component="button"
                    sx={{ fontSize: '12px', color: tuyaColors.info, textDecoration: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.25 }}
                  >
                    Change Product
                    <Select
                      size="small"
                      value={selectedProfileId}
                      onChange={(e) => setSelectedProfileId(e.target.value)}
                      sx={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                    >
                      {profileInfos.map((pi) => (
                        <MenuItem key={pi.id.id} value={pi.id.id} sx={{ fontSize: '12px' }}>
                          {pi.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </Link>
                  {/* Visible dropdown */}
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
                Development Details
              </Link>
            </Box>
          </Paper>

          {/* Info Banner */}
          <Box sx={{
            bgcolor: '#E6F7FF', border: '1px solid #91D5FF', borderRadius: 1,
            px: 2, py: 1, mb: 2, display: 'flex', alignItems: 'center', gap: 1,
          }}>
            <InfoOutlinedIcon sx={{ fontSize: 16, color: tuyaColors.info }} />
            <Typography sx={{ fontSize: '12px', color: tuyaColors.textPrimary }}>
              A new version can be updated. Please click the button <strong>New Update Deployment</strong> to Update.
            </Typography>
          </Box>

          {/* Action Bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Select
              size="small"
              value="all"
              sx={{ height: 28, fontSize: '12px', minWidth: 220, '& .MuiOutlinedInput-notchedOutline': { borderColor: tuyaColors.border } }}
            >
              <MenuItem value="all" sx={{ fontSize: '12px' }}>General firmware scheme</MenuItem>
            </Select>

            <Link
              component="button"
              onClick={() => navigate('/firmware/management')}
              sx={{ fontSize: '12px', color: tuyaColors.textSecondary, textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              Go to Firmware Management
            </Link>

            <Box sx={{ flex: 1 }} />

            <Button
              variant="outlined"
              sx={{ height: 32, fontSize: '12px', px: 2, color: tuyaColors.textPrimary, borderColor: tuyaColors.border }}
            >
              Common Verification Device
            </Button>
            <Button
              variant="contained"
              sx={{ height: 32, fontSize: '13px', px: 2 }}
            >
              New Update Deployment
            </Button>
          </Box>

          {/* Firmware Table */}
          <Paper elevation={0} sx={{ border: `1px solid ${tuyaColors.border}`, borderRadius: 1 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '16%' }}>Firmware Name/Key</TableCell>
                    <TableCell sx={{ width: '10%' }}>Firmware Type</TableCell>
                    <TableCell sx={{ width: '16%' }}>Firmware Version</TableCell>
                    <TableCell sx={{ width: '14%' }}>Creation/Update Time</TableCell>
                    <TableCell sx={{ width: '10%' }}>Firmware Source</TableCell>
                    <TableCell sx={{ width: '10%' }}>Update Method</TableCell>
                    <TableCell sx={{ width: '10%' }}>Description</TableCell>
                    <TableCell sx={{ width: '8%' }}>Firmware Update</TableCell>
                    <TableCell sx={{ width: '6%', textAlign: 'right' }}>Operation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingPackages ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={24} sx={{ color: tuyaColors.orange }} />
                      </TableCell>
                    </TableRow>
                  ) : packages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                        <DevicesOtherIcon sx={{ fontSize: 36, color: tuyaColors.textHint, mb: 0.5, display: 'block', mx: 'auto' }} />
                        <Typography variant="body2" sx={{ color: tuyaColors.textHint }}>No firmware updates found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    packages.map((pkg) => (
                      <TableRow key={pkg.id.id} hover>
                        <TableCell>
                          <Box>
                            <Typography sx={{ fontSize: '12px', fontWeight: 500, color: tuyaColors.textPrimary }}>{pkg.title}</Typography>
                            <Typography sx={{ fontSize: '10px', color: tuyaColors.textHint, fontFamily: 'monospace' }}>{pkg.id.id.substring(0, 16)}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '12px' }}>{pkg.type === 'FIRMWARE' ? 'MCU Firmware' : 'Software'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '12px' }}>{pkg.version}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '11px', color: tuyaColors.textSecondary }}>{formatDateTime(pkg.createdTime)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint }}>Upload</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint }}>—</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint }}>{pkg.tag || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint }}>—</Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Link
                            component="button"
                            sx={{ color: tuyaColors.info, fontSize: '12px', textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          >
                            Details
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
}
