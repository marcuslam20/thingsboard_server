/*
 * Copyright © 2016-2025 The Thingsboard Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import TableSortLabel from '@mui/material/TableSortLabel';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import DeviceDialog from './DeviceDialog';
import DeviceCredentialsDialog from './DeviceCredentialsDialog';
import { DeviceInfo, Device } from '@/models/device.model';
import { deviceApi } from '@/api/device.api';
import { deviceProfileApi, DeviceProfileInfo } from '@/api/device-profile.api';
import { tuyaColors } from '@/theme/theme';

// Compact input style — matching DeviceProfilesPage 11px pattern
const compactInputSx = {
  '& .MuiInputBase-root': { height: 24, fontSize: '11px' },
  '& .MuiInputBase-input': { py: '2px', px: '8px' },
};

const compactSelectSx = {
  height: 24,
  fontSize: '11px',
  '& .MuiSelect-select': { py: '2px', px: '8px' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: tuyaColors.border },
};

const compactBtnSx = {
  minWidth: 0,
  px: 1,
  height: 24,
  fontSize: '11px',
  color: tuyaColors.textSecondary,
  borderColor: tuyaColors.border,
};

function maskUuid(uuid: string): string {
  if (uuid.length < 12) return uuid;
  return uuid.substring(0, 4) + '****' + uuid.substring(uuid.length - 4);
}

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}

function exportToCsv(devices: DeviceInfo[]) {
  const headers = ['Device Name', 'Device ID', 'UUID', 'Product', 'Device Type', 'Product ID', 'Firmware Version', 'Device Status', 'Created'];
  const rows = devices.map((d) => [
    d.name,
    d.id.id,
    d.id.id,
    d.deviceProfileName,
    d.type || 'Common Device',
    d.deviceProfileId.id,
    '',
    d.active ? 'Online' : 'Offline',
    formatDateTime(d.createdTime),
  ]);
  const csvContent = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `devices_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DevicesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DeviceInfo[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [sortProperty, setSortProperty] = useState('createdTime');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Filters
  const [activateFilter, setActivateFilter] = useState<string>('all');
  const [searchName, setSearchName] = useState('');
  const [searchUuid, setSearchUuid] = useState('');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [searchProductId, setSearchProductId] = useState('');

  // Applied filters (applied on Search click)
  const [appliedName, setAppliedName] = useState('');
  const [appliedActive, setAppliedActive] = useState<boolean | undefined>(undefined);
  const [appliedProfileId, setAppliedProfileId] = useState<string | undefined>(undefined);
  const [appliedUuid, setAppliedUuid] = useState('');
  const [appliedProductId, setAppliedProductId] = useState('');

  // Device profile infos for Product dropdown
  const [profileInfos, setProfileInfos] = useState<DeviceProfileInfo[]>([]);

  // Stats — accurate counts from separate API calls
  const [totalDevices, setTotalDevices] = useState(0);
  const [onlineDevices, setOnlineDevices] = useState(0);

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<DeviceInfo | null>(null);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [credentialsDeviceId, setCredentialsDeviceId] = useState('');

  // Load device profile infos for Product dropdown
  useEffect(() => {
    deviceProfileApi.getDeviceProfileInfos({ page: 0, pageSize: 100, sortProperty: 'name', sortOrder: 'ASC' })
      .then((result) => setProfileInfos(result.data))
      .catch(() => setProfileInfos([]));
  }, []);

  // Load accurate stats on mount
  useEffect(() => {
    // Total devices
    deviceApi.getTenantDeviceInfos({ page: 0, pageSize: 1, sortProperty: 'createdTime', sortOrder: 'DESC' })
      .then((r) => setTotalDevices(r.totalElements))
      .catch(() => {});
    // Online devices
    deviceApi.getTenantDeviceInfos({ page: 0, pageSize: 1, sortProperty: 'createdTime', sortOrder: 'DESC' }, undefined, undefined, true)
      .then((r) => setOnlineDevices(r.totalElements))
      .catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await deviceApi.getTenantDeviceInfos(
        {
          page,
          pageSize,
          textSearch: appliedName || undefined,
          sortProperty,
          sortOrder,
        },
        undefined,
        appliedProfileId,
        appliedActive,
      );
      setData(result.data);
      setTotalElements(result.totalElements);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedName, appliedActive, appliedProfileId, sortProperty, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side filtering for UUID and Product ID
  const filteredData = useMemo(() => {
    let result = data;
    if (appliedUuid) {
      const lower = appliedUuid.toLowerCase();
      result = result.filter((d) => d.id.id.toLowerCase().includes(lower));
    }
    if (appliedProductId) {
      const lower = appliedProductId.toLowerCase();
      result = result.filter((d) => d.deviceProfileId.id.toLowerCase().includes(lower));
    }
    return result;
  }, [data, appliedUuid, appliedProductId]);

  const handleSearch = () => {
    setAppliedName(searchName);
    setAppliedActive(activateFilter === 'all' ? undefined : activateFilter === 'activated');
    setAppliedProfileId(productFilter === 'all' ? undefined : productFilter);
    setAppliedUuid(searchUuid);
    setAppliedProductId(searchProductId);
    setPage(0);
  };

  const handleReset = () => {
    setSearchName('');
    setSearchUuid('');
    setSearchProductId('');
    setActivateFilter('all');
    setProductFilter('all');
    setAppliedName('');
    setAppliedActive(undefined);
    setAppliedProfileId(undefined);
    setAppliedUuid('');
    setAppliedProductId('');
    setPage(0);
  };

  const handleSort = (property: string) => {
    if (sortProperty === property) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortProperty(property);
      setSortOrder('ASC');
    }
  };

  const handleSaved = () => {
    setDialogOpen(false);
    setEditDevice(null);
    loadData();
  };

  const handleDelete = async () => {
    if (deviceToDelete) {
      await deviceApi.deleteDevice(deviceToDelete.id.id);
      setDeleteDialogOpen(false);
      setDeviceToDelete(null);
      loadData();
    }
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            Devices
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13px' }}>
            Manage and monitor all devices that are activated on the platform.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          sx={{
            height: 24,
            fontSize: '11px',
            px: 1.5,
            color: tuyaColors.info,
            borderColor: tuyaColors.info,
            '&:hover': { borderColor: tuyaColors.info, bgcolor: 'rgba(0,139,213,0.04)' },
          }}
        >
          Choose Data Center
        </Button>
      </Box>

      {/* Stats Row */}
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 6, mb: 2.5, pt: 1, borderTop: `1px solid ${tuyaColors.border}` }}>
            <Box>
              <Typography sx={{ fontSize: '11px', color: tuyaColors.textHint, mb: 0.25 }}>Total Devices</Typography>
              <Typography sx={{ fontSize: '24px', fontWeight: 400, color: tuyaColors.textPrimary, lineHeight: '32px' }}>
                {totalDevices}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '11px', color: tuyaColors.textHint, mb: 0.25 }}>Device Bounds</Typography>
              <Typography sx={{ fontSize: '24px', fontWeight: 400, color: tuyaColors.textPrimary, lineHeight: '32px' }}>
                {totalDevices}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '11px', color: tuyaColors.textHint, mb: 0.25 }}>Device Online</Typography>
              <Typography sx={{ fontSize: '24px', fontWeight: 400, color: tuyaColors.textPrimary, lineHeight: '32px' }}>
                {onlineDevices}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '11px', color: tuyaColors.textHint, mb: 0.25 }}>Firmware Update Times</Typography>
              <Typography sx={{ fontSize: '24px', fontWeight: 400, color: tuyaColors.textPrimary, lineHeight: '32px' }}>
                0
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '11px', color: tuyaColors.textHint, mb: 0.25 }}>Message Amounts</Typography>
              <Typography sx={{ fontSize: '24px', fontWeight: 400, color: tuyaColors.textPrimary, lineHeight: '32px' }}>
                0
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }} />
            <Typography sx={{ fontSize: '11px', color: tuyaColors.textHint, mb: 1 }}>
              Total usage:{' '}
              <Typography component="span" sx={{ color: tuyaColors.info, cursor: 'pointer', fontSize: '11px' }}>
                View details
              </Typography>
            </Typography>
          </Box>

          {/* Filter Bar */}
          <Paper elevation={0} sx={{ p: '8px 0', mb: 0, boxShadow: 'none', borderRadius: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '11px', color: tuyaColors.textSecondary, mr: 0.5 }}>
                Enter:
              </Typography>

              {/* Activate dropdown */}
              <Select
                size="small"
                value={activateFilter}
                onChange={(e) => setActivateFilter(e.target.value)}
                sx={{ ...compactSelectSx, minWidth: 90 }}
              >
                <MenuItem value="all" sx={{ fontSize: '11px' }}>Activate</MenuItem>
                <MenuItem value="activated" sx={{ fontSize: '11px' }}>Activated</MenuItem>
                <MenuItem value="unactivated" sx={{ fontSize: '11px' }}>Unactivated</MenuItem>
              </Select>

              {/* Device name */}
              <TextField
                size="small"
                placeholder="Device name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                sx={{ width: 140, ...compactInputSx }}
              />

              {/* UUID */}
              <TextField
                size="small"
                placeholder="UUID"
                value={searchUuid}
                onChange={(e) => setSearchUuid(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                sx={{ width: 110, ...compactInputSx }}
              />

              {/* Product dropdown */}
              <Select
                size="small"
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                sx={{ ...compactSelectSx, minWidth: 130 }}
                displayEmpty
              >
                <MenuItem value="all" sx={{ fontSize: '11px' }}>Product</MenuItem>
                {profileInfos.map((pi) => (
                  <MenuItem key={pi.id.id} value={pi.id.id} sx={{ fontSize: '11px' }}>
                    {pi.name}
                  </MenuItem>
                ))}
              </Select>

              {/* Product ID */}
              <TextField
                size="small"
                placeholder="Product ID"
                value={searchProductId}
                onChange={(e) => setSearchProductId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                sx={{ width: 140, ...compactInputSx }}
              />

              <Button variant="outlined" onClick={handleSearch} sx={compactBtnSx}>
                Search
              </Button>
              <Button variant="outlined" onClick={handleReset} sx={compactBtnSx}>
                Reset
              </Button>

              <Box sx={{ flex: 1 }} />

              <Button
                variant="contained"
                startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                onClick={() => { setEditDevice(null); setDialogOpen(true); }}
                sx={{ minWidth: 0, px: 1.5, height: 24, fontSize: '11px' }}
              >
                Add Device
              </Button>

              <Button
                variant="outlined"
                startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 14 }} />}
                onClick={() => exportToCsv(filteredData)}
                sx={{ ...compactBtnSx, px: 1.5 }}
              >
                Export data
              </Button>
            </Box>
          </Paper>

          {/* Device Table — 9 columns */}
          <Paper elevation={0} sx={{ borderRadius: 0, boxShadow: 'none' }}>
            <TableContainer>
              <Table sx={{ '& td': { fontSize: '11px' }, '& th': { fontSize: '12px' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '18%' }}>
                      <TableSortLabel
                        active={sortProperty === 'name'}
                        direction={sortProperty === 'name' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : 'asc'}
                        onClick={() => handleSort('name')}
                      >
                        Device Name/ID
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: '10%' }}>UUID</TableCell>
                    <TableCell sx={{ width: '14%' }}>Product</TableCell>
                    <TableCell sx={{ width: '10%' }}>Device Type</TableCell>
                    <TableCell sx={{ width: '12%' }}>Product ID</TableCell>
                    <TableCell sx={{ width: '8%' }}>Firmware Version</TableCell>
                    <TableCell sx={{ width: '8%' }}>Device Status</TableCell>
                    <TableCell sx={{ width: '10%' }}>
                      <TableSortLabel
                        active={sortProperty === 'createdTime'}
                        direction={sortProperty === 'createdTime' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : 'asc'}
                        onClick={() => handleSort('createdTime')}
                      >
                        Created
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: '10%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <Typography sx={{ fontWeight: 500, color: '#1a1a1a', fontSize: '12px', mr: 'auto', pl: 1 }}>
                          Operation
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Box sx={{ width: '1px', height: 14, bgcolor: tuyaColors.border }} />
                          <IconButton size="small" sx={{ p: 0.25, color: tuyaColors.textHint }}>
                            <SettingsOutlinedIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={32} sx={{ color: tuyaColors.orange }} />
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                        <DevicesOtherIcon sx={{ fontSize: 48, color: tuyaColors.textHint, mb: 1, display: 'block', mx: 'auto' }} />
                        <Typography color="text.secondary">No devices found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((device) => (
                      <TableRow
                        key={device.id.id}
                        hover
                        onClick={() => navigate(`/entities/devices/${device.id.id}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        {/* Device Name/ID */}
                        <TableCell>
                          <Box>
                            <Typography sx={{ fontWeight: 500, fontSize: '11px', color: tuyaColors.textPrimary }}>
                              {device.name}
                            </Typography>
                            <Typography sx={{ fontSize: '10px', color: tuyaColors.textHint }}>
                              {device.id.id}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* UUID (masked) */}
                        <TableCell>
                          <Typography sx={{ fontSize: '11px', color: tuyaColors.textSecondary }}>
                            {maskUuid(device.id.id)}
                          </Typography>
                        </TableCell>

                        {/* Product */}
                        <TableCell>
                          <Typography sx={{ fontSize: '11px' }}>{device.deviceProfileName}</Typography>
                        </TableCell>

                        {/* Device Type */}
                        <TableCell>
                          <Typography sx={{ fontSize: '11px' }}>{device.type || 'Common Device'}</Typography>
                        </TableCell>

                        {/* Product ID */}
                        <TableCell>
                          <Typography sx={{ fontSize: '10px', color: tuyaColors.textHint, fontFamily: 'monospace' }}>
                            {device.deviceProfileId.id.substring(0, 16)}
                          </Typography>
                        </TableCell>

                        {/* Firmware Version */}
                        <TableCell>
                          <Typography sx={{ fontSize: '11px', color: tuyaColors.textHint }}>—</Typography>
                        </TableCell>

                        {/* Device Status (dot + text) */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: device.active ? tuyaColors.success : tuyaColors.textHint,
                                flexShrink: 0,
                              }}
                            />
                            <Typography
                              sx={{
                                fontSize: '11px',
                                color: device.active ? tuyaColors.success : tuyaColors.textHint,
                              }}
                            >
                              {device.active ? 'Online' : 'Offline'}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Created */}
                        <TableCell>
                          <Typography sx={{ fontSize: '11px' }}>
                            {formatDateTime(device.createdTime)}
                          </Typography>
                        </TableCell>

                        {/* Operation — text links */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Link
                              component="button"
                              onClick={() => navigate(`/entities/devices/${device.id.id}`)}
                              sx={{
                                color: tuyaColors.info,
                                fontSize: '11px',
                                textDecoration: 'none',
                                cursor: 'pointer',
                                '&:hover': { textDecoration: 'underline' },
                              }}
                            >
                              Debug
                            </Link>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setCredentialsDeviceId(device.id.id);
                                setCredentialsDialogOpen(true);
                              }}
                              sx={{ p: 0.25, color: tuyaColors.textHint }}
                            >
                              <SettingsOutlinedIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalElements}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[10, 20, 50]}
            />
          </Paper>

      {/* Dialogs */}
      <DeviceDialog
        open={dialogOpen} device={editDevice}
        onClose={() => { setDialogOpen(false); setEditDevice(null); }}
        onSaved={handleSaved}
      />
      <ConfirmDialog
        open={deleteDialogOpen} title="Delete Device"
        content={`Are you sure you want to delete device "${deviceToDelete?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteDialogOpen(false); setDeviceToDelete(null); }}
      />
      <DeviceCredentialsDialog
        open={credentialsDialogOpen} deviceId={credentialsDeviceId}
        onClose={() => setCredentialsDialogOpen(false)}
      />
    </Box>
  );
}
