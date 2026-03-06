import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import { Customer, customerApi } from '@/api/customer.api';
import { deviceProfileApi } from '@/api/device-profile.api';
import { tuyaColors } from '@/theme/theme';

interface DeviceRow {
  id: string;
  name: string;
  deviceId: string;
  product: string;
  pid: string;
  productType: string;
  addMethod: string;
}

export default function AppUserDetailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uid = searchParams.get('uid') || '';
  const ac = searchParams.get('ac') || '';

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      // Load customer info
      const cust = await customerApi.getCustomer(uid);
      setCustomer(cust);

      // Load customer devices
      const devicesResult = await customerApi.getCustomerDevices(uid, {
        page: 0,
        pageSize: 100,
        sortProperty: 'createdTime',
        sortOrder: 'DESC',
      });

      // Build device rows with profile info
      const rows: DeviceRow[] = [];
      const profileCache: Record<string, string> = {};

      for (const dev of devicesResult.data as Array<Record<string, unknown>>) {
        const profileId = (dev.deviceProfileId as { id: string })?.id || '';
        let profileName = profileCache[profileId] || '';

        if (profileId && !profileCache[profileId]) {
          try {
            const profile = await deviceProfileApi.getDeviceProfile(profileId);
            profileName = profile.name || '';
            profileCache[profileId] = profileName;
          } catch {
            profileName = '';
          }
        }

        rows.push({
          id: (dev.id as { id: string })?.id || '',
          name: (dev.name as string) || (dev.label as string) || '—',
          deviceId: ((dev.id as { id: string })?.id || '').replace(/-/g, '').substring(0, 16),
          product: profileName,
          pid: profileId.replace(/-/g, '').substring(0, 10),
          productType: (dev.type as string) || '—',
          addMethod: "User's Own Device",
        });
      }

      setDevices(rows);
    } catch (err) {
      console.error('Failed to load user data:', err);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(devices.map((d) => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const allSelected = devices.length > 0 && selectedIds.size === devices.length;
  const userEmail = ac || customer?.email || customer?.name || '—';
  const deviceCount = devices.length;

  return (
    <Box>
      {/* Header: Back arrow + Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton
          onClick={() => navigate('/operation/app')}
          sx={{ color: tuyaColors.info }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 400 }}>
          App User
        </Typography>
      </Box>

      {/* User info bar */}
      <Paper elevation={0} sx={{ px: 3, py: 2, mb: 0, border: `1px solid ${tuyaColors.border}`, borderBottom: 'none', borderRadius: '8px 8px 0 0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 24, height: 24, borderRadius: '50%',
            bgcolor: '#f0f5ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <DevicesOtherIcon sx={{ fontSize: 14, color: tuyaColors.info }} />
          </Box>
          <Typography component="span" sx={{ fontSize: '13px', color: tuyaColors.textPrimary }}>
            <Box component="span" sx={{ fontWeight: 500 }}>Osprey</Box>
            {' | '}
            <Box component="span" sx={{ color: tuyaColors.textSecondary }}>User {userEmail} has {deviceCount} device(s)</Box>
          </Typography>
        </Box>
      </Paper>

      {/* Devices Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={32} sx={{ color: tuyaColors.orange }} />
        </Box>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: '0 0 8px 8px', border: `1px solid ${tuyaColors.border}` }}>
          <TableContainer>
            <Table sx={{ '& td': { fontSize: '13px' }, '& th': { fontSize: '13px' } }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ width: 48 }}>
                    <Checkbox
                      size="small"
                      checked={allSelected}
                      indeterminate={selectedIds.size > 0 && !allSelected}
                      onChange={(_, checked) => handleSelectAll(checked)}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Device Name</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Device ID</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>PID</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Product Type</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Add Method</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {devices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography sx={{ fontSize: '13px', color: tuyaColors.textHint }}>
                        No devices found for this user
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  devices.map((device) => (
                    <TableRow key={device.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={selectedIds.has(device.id)}
                          onChange={(_, checked) => handleSelectOne(device.id, checked)}
                        />
                      </TableCell>
                      <TableCell>{device.name}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '13px', fontFamily: 'monospace', color: tuyaColors.textSecondary }}>
                          {device.deviceId}
                        </Typography>
                      </TableCell>
                      <TableCell>{device.product}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '13px', fontFamily: 'monospace', color: tuyaColors.textSecondary }}>
                          {device.pid}
                        </Typography>
                      </TableCell>
                      <TableCell>{device.productType}</TableCell>
                      <TableCell>{device.addMethod}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Download link */}
          {devices.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 3, py: 1.5, borderTop: `1px solid ${tuyaColors.border}` }}>
              <Link
                component="button"
                sx={{
                  fontSize: '13px', color: tuyaColors.info,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Download more data of this user
              </Link>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}
