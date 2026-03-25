import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AddIcon from '@mui/icons-material/Add';
import Tooltip from '@mui/material/Tooltip';
import { DeviceProfile } from '@/models/device.model';
import { DeviceInfo } from '@/models/device.model';
import { deviceApi } from '@/api/device.api';
import { deviceProfileApi, DeviceProfileInfo } from '@/api/device-profile.api';
import { smartHomeProductApi } from '@/api/smarthome-product.api';
import { tuyaColors } from '@/theme/theme';
import DeviceDebugConsole from './DeviceDebugConsole';

export default function DeviceDebugPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Profile list + selection
  const [profileInfos, setProfileInfos] = useState<DeviceProfileInfo[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(searchParams.get('profileId') || '');
  const [selectedProfile, setSelectedProfile] = useState<DeviceProfile | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // Devices for selected profile
  const [debugDevices, setDebugDevices] = useState<DeviceInfo[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  // Debug console
  const [debugDeviceId, setDebugDeviceId] = useState<string | null>(null);
  const debugDevice = debugDevices.find((d) => d.id.id === debugDeviceId);

  // Sub-tab for Real Device Debug section
  const [realDeviceTab, setRealDeviceTab] = useState<'deviceId' | 'appAccount'>('deviceId');

  // Load profiles on mount
  useEffect(() => {
    setLoadingProfiles(true);
    deviceProfileApi.getDeviceProfileInfos({ page: 0, pageSize: 100, sortProperty: 'name', sortOrder: 'ASC' })
      .then((result) => {
        setProfileInfos(result.data);
        // Auto-select first if none selected
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
    // Update URL
    setSearchParams({ profileId: selectedProfileId }, { replace: true });

    deviceProfileApi.getDeviceProfile(selectedProfileId)
      .then((profile) => {
        setSelectedProfile(profile);
        // Load category name if available
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

  // Load devices for selected profile
  const loadDevices = useCallback(async () => {
    if (!selectedProfileId) return;
    setLoadingDevices(true);
    try {
      const result = await deviceApi.getTenantDeviceInfos(
        { page: 0, pageSize: 50, sortProperty: 'createdTime', sortOrder: 'DESC' },
        undefined,
        selectedProfileId,
      );
      setDebugDevices(result.data);
    } catch {
      setDebugDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  }, [selectedProfileId]);

  useEffect(() => {
    setDebugDeviceId(null);
    loadDevices();
  }, [loadDevices]);

  const handleProfileChange = (profileId: string) => {
    setSelectedProfileId(profileId);
    setDebugDeviceId(null);
  };

  const handleRemoveDevice = async (deviceId: string) => {
    // Just remove from the debug list (not deleting the device)
    setDebugDevices((prev) => prev.filter((d) => d.id.id !== deviceId));
  };

  if (loadingProfiles) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: tuyaColors.orange }} />
      </Box>
    );
  }

  // If debug console is active, show it
  if (debugDeviceId && debugDevice) {
    return (
      <Box>
        {/* Page header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ mb: 0.5 }}>{t('debug.title')}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13px' }}>
              {t('debug.description')}
            </Typography>
          </Box>
        </Box>

        <DeviceDebugConsole
          deviceId={debugDeviceId}
          deviceName={debugDevice.name}
          deviceProfileId={selectedProfileId}
          active={debugDevice.active}
          onBack={() => setDebugDeviceId(null)}
        />
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 0.5 }}>{t('debug.title')}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13px' }}>
            {t('debug.description')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Link
            href="#"
            sx={{ fontSize: '12px', color: tuyaColors.info, textDecoration: 'none', '&:hover': { textDecoration: 'underline' }, mt: 0.5 }}
          >
            {t('debug.view-docs')}
          </Link>
          <Button
            variant="outlined"
            sx={{
              height: 24, fontSize: '11px', px: 1.5,
              color: tuyaColors.info, borderColor: tuyaColors.info,
              '&:hover': { borderColor: tuyaColors.info, bgcolor: 'rgba(0,139,213,0.04)' },
            }}
          >
            {t('debug.choose-data-center')}
          </Button>
        </Box>
      </Box>

      {/* "My Products" tab */}
      <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${tuyaColors.border}`, mb: 2.5 }}>
        <Box
          sx={{
            px: 2, py: 1, cursor: 'pointer', fontSize: '13px', fontWeight: 500,
            color: tuyaColors.info,
            borderBottom: `2px solid ${tuyaColors.info}`,
            mb: '-1px',
          }}
        >
          {t('debug.my-products')}
        </Box>
      </Box>

      {/* Product Card */}
      {profileInfos.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <DevicesOtherIcon sx={{ fontSize: 48, color: tuyaColors.textHint, mb: 1, display: 'block', mx: 'auto' }} />
          <Typography variant="body2" sx={{ color: tuyaColors.textHint }}>
            {t('debug.no-products')}
          </Typography>
        </Box>
      ) : (
        <>
          {/* Product selector card */}
          <Paper elevation={0} sx={{ border: `1px solid ${tuyaColors.border}`, borderRadius: 1, p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 1, bgcolor: 'rgba(0,139,213,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <DevicesOtherIcon sx={{ fontSize: 20, color: tuyaColors.info }} />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: tuyaColors.textPrimary }}>
                    {selectedProfile?.name || t('debug.select-product')}
                  </Typography>
                  <Select
                    size="small"
                    value={selectedProfileId}
                    onChange={(e) => handleProfileChange(e.target.value)}
                    sx={{ height: 24, fontSize: '11px', minWidth: 140 }}
                  >
                    {profileInfos.map((pi) => (
                      <MenuItem key={pi.id.id} value={pi.id.id} sx={{ fontSize: '11px' }}>
                        {pi.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
                <Typography sx={{ fontSize: '11px', color: tuyaColors.textHint }}>
                  {t('debug.custom')}
                  {selectedProfile && <> | {t('debug.pid')}: {selectedProfileId.substring(0, 16)}</>}
                  {categoryName && <> | {t('debug.category')}: {categoryName}</>}
                  {selectedProfile?.transportType && <> | {t('debug.protocol')}: {selectedProfile.transportType}</>}
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
                {t('debug.development-details')}
              </Link>
            </Box>
          </Paper>

          {/* Yellow info banner */}
          <Box sx={{
            bgcolor: '#FFF8E6', border: '1px solid #FFE58F', borderRadius: 1,
            px: 2, py: 1, mb: 2.5,
          }}>
            <Typography sx={{ fontSize: '12px', color: '#8C6D1F' }}>
              {t('debug.debug-info')}
            </Typography>
          </Box>

          {/* Real Device Debug section */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, color: tuyaColors.textPrimary }}>
                {t('debug.real-device')}
              </Typography>
              <Tooltip title={t('debug.real-device-desc')}>
                <HelpOutlineIcon sx={{ fontSize: 16, color: tuyaColors.textHint, cursor: 'pointer' }} />
              </Tooltip>
            </Box>

            {/* Sub-tabs: Device ID | App Account */}
            <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${tuyaColors.border}`, mb: 1.5 }}>
              <Box
                onClick={() => setRealDeviceTab('deviceId')}
                sx={{
                  px: 2, py: 0.75, cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                  color: realDeviceTab === 'deviceId' ? tuyaColors.info : tuyaColors.textSecondary,
                  borderBottom: realDeviceTab === 'deviceId' ? `2px solid ${tuyaColors.info}` : '2px solid transparent',
                  mb: '-1px',
                }}
              >
                {t('debug.device-id')}
              </Box>
              <Box
                onClick={() => setRealDeviceTab('appAccount')}
                sx={{
                  px: 2, py: 0.75, cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                  color: realDeviceTab === 'appAccount' ? tuyaColors.info : tuyaColors.textSecondary,
                  borderBottom: realDeviceTab === 'appAccount' ? `2px solid ${tuyaColors.info}` : '2px solid transparent',
                  mb: '-1px',
                }}
              >
                {t('debug.app-account')}
              </Box>
            </Box>

            {/* Device table */}
            <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${tuyaColors.border}`, borderRadius: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '45%' }}>{t('debug.device-name-id')}</TableCell>
                    <TableCell sx={{ width: '20%' }}>{t('debug.status')}</TableCell>
                    <TableCell sx={{ width: '35%', textAlign: 'right' }}>{t('device.operation')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingDevices ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={24} sx={{ color: tuyaColors.orange }} />
                      </TableCell>
                    </TableRow>
                  ) : debugDevices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        <DevicesOtherIcon sx={{ fontSize: 36, color: tuyaColors.textHint, mb: 0.5, display: 'block', mx: 'auto' }} />
                        <Typography variant="body2" sx={{ color: tuyaColors.textHint }}>{t('debug.no-data')}</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    debugDevices.map((device) => (
                      <TableRow key={device.id.id} hover>
                        <TableCell>
                          <Box>
                            <Typography sx={{ fontWeight: 500, fontSize: '12px', color: tuyaColors.textPrimary }}>
                              {device.name}
                            </Typography>
                            <Typography sx={{ fontSize: '10px', color: tuyaColors.textHint, fontFamily: 'monospace' }}>
                              {device.id.id}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={device.active ? t('debug.online') : t('debug.offline')}
                            size="small"
                            sx={{
                              fontSize: '10px', height: 20,
                              bgcolor: device.active ? 'rgba(82,196,26,0.1)' : 'rgba(0,0,0,0.05)',
                              color: device.active ? tuyaColors.success : tuyaColors.textHint,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Link
                            component="button"
                            onClick={() => setDebugDeviceId(device.id.id)}
                            sx={{
                              color: tuyaColors.info, fontSize: '12px', textDecoration: 'none', cursor: 'pointer',
                              mr: 2, '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            {t('device.debug')}
                          </Link>
                          <Link
                            component="button"
                            onClick={() => handleRemoveDevice(device.id.id)}
                            sx={{
                              color: tuyaColors.info, fontSize: '12px', textDecoration: 'none', cursor: 'pointer',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            {t('debug.remove')}
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Add Real Device Debug button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                onClick={() => navigate('/entities/devices')}
                sx={{
                  height: 28, fontSize: '11px',
                  color: tuyaColors.info, borderColor: tuyaColors.info,
                  '&:hover': { borderColor: tuyaColors.info, bgcolor: 'rgba(0,139,213,0.04)' },
                }}
              >
                {t('debug.add-real-device')}
              </Button>
            </Box>
          </Box>

          {/* Virtual Device section */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, color: tuyaColors.textPrimary }}>
                {t('debug.virtual-device')}
              </Typography>
              <Tooltip title={t('debug.virtual-device-desc')}>
                <HelpOutlineIcon sx={{ fontSize: 16, color: tuyaColors.textHint, cursor: 'pointer' }} />
              </Tooltip>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${tuyaColors.border}`, borderRadius: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '60%' }}>{t('debug.device-id')}</TableCell>
                    <TableCell sx={{ width: '40%', textAlign: 'right' }}>{t('device.operation')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                      <DevicesOtherIcon sx={{ fontSize: 36, color: tuyaColors.textHint, mb: 0.5, display: 'block', mx: 'auto' }} />
                      <Typography variant="body2" sx={{ color: tuyaColors.textHint }}>No Data</Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                disabled
                sx={{
                  height: 28, fontSize: '11px',
                  color: tuyaColors.textHint, borderColor: tuyaColors.border,
                }}
              >
                {t('debug.add-virtual-device')}
              </Button>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
