import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
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
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import DeviceDialog from './DeviceDialog';
import DeviceCredentialsDialog from './DeviceCredentialsDialog';
import { DeviceInfo, Device } from '@/models/device.model';
import { deviceApi } from '@/api/device.api';
import { tuyaColors } from '@/theme/theme';

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
  const [searchName, setSearchName] = useState('');
  const [searchDeviceId, setSearchDeviceId] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Stats
  const [totalDevices, setTotalDevices] = useState(0);
  const [activeDevices, setActiveDevices] = useState(0);
  const [inactiveDevices, setInactiveDevices] = useState(0);

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<DeviceInfo | null>(null);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [credentialsDeviceId, setCredentialsDeviceId] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await deviceApi.getTenantDeviceInfos({
        page,
        pageSize,
        textSearch: appliedSearch || undefined,
        sortProperty,
        sortOrder,
      });
      setData(result.data);
      setTotalElements(result.totalElements);
      setTotalDevices(result.totalElements);

      // Count active/inactive from current page (approximate)
      const active = result.data.filter((d) => d.active).length;
      setActiveDevices(active);
      setInactiveDevices(result.data.length - active);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedSearch, sortProperty, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = () => {
    setAppliedSearch(searchName);
    setPage(0);
  };

  const handleReset = () => {
    setSearchName('');
    setSearchDeviceId('');
    setAppliedSearch('');
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
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            Devices
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13px' }}>
            Manage and monitor all devices that are activated on the platform.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => { setEditDevice(null); setDialogOpen(true); }}
        >
          + Cloud Data Center
        </Button>
      </Box>

      {/* Divider + Stat row — label on top, number below, inline like Tuya */}
      <Box sx={{ borderTop: '1px solid #e0e0e0', pt: 2, mt: 1.5 }} />
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 10, mb: 2.5 }}>
        <Box>
          <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint, mb: 0.25 }}>Total Devices</Typography>
          <Typography sx={{ fontSize: '28px', fontWeight: 400, color: tuyaColors.textPrimary, lineHeight: '38px' }}>
            {totalDevices}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint, mb: 0.25 }}>Device Bounds</Typography>
          <Typography sx={{ fontSize: '28px', fontWeight: 400, color: tuyaColors.textPrimary, lineHeight: '38px' }}>
            {activeDevices}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint, mb: 0.25 }}>Device Online</Typography>
          <Typography sx={{ fontSize: '28px', fontWeight: 400, color: tuyaColors.textPrimary, lineHeight: '38px' }}>
            {inactiveDevices}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint, mb: 1 }}>
          Total usage: <Typography component="span" sx={{ color: tuyaColors.info, cursor: 'pointer', fontSize: '12px' }}>View details</Typography>
        </Typography>
      </Box>

      {/* Filter Bar */}
      <Paper elevation={0} sx={{ p: '12px 0', mb: 0, boxShadow: 'none', borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ color: tuyaColors.textSecondary, mr: 0.5 }}>
            Enter:
          </Typography>
          <TextField
            size="small"
            placeholder="Device ID / Device name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ width: 200 }}
          />
          <TextField
            size="small"
            placeholder="UUID"
            value={searchDeviceId}
            onChange={(e) => setSearchDeviceId(e.target.value)}
            sx={{ width: 140 }}
          />
          <TextField
            size="small"
            placeholder="Product ID / Product Name"
            sx={{ width: 200 }}
          />

          <Button variant="contained" onClick={handleSearch} sx={{ minWidth: 80 }}>
            Search
          </Button>
          <Button
            variant="outlined"
            onClick={handleReset}
            sx={{ minWidth: 80, color: tuyaColors.textSecondary, borderColor: tuyaColors.border }}
          >
            Reset
          </Button>

          <Box sx={{ flex: 1 }} />

          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            sx={{ color: tuyaColors.textSecondary, borderColor: tuyaColors.border }}
          >
            Export data
          </Button>
        </Box>
      </Paper>

      {/* Device Table */}
      <Paper elevation={0} sx={{ borderRadius: 0, boxShadow: 'none' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '22%' }}>
                  <TableSortLabel
                    active={sortProperty === 'name'}
                    direction={sortProperty === 'name' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Device Name/ID
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '10%' }}>UUID</TableCell>
                <TableCell sx={{ width: '15%' }}>Product</TableCell>
                <TableCell sx={{ width: '12%' }}>Device Type</TableCell>
                <TableCell sx={{ width: '8%' }}>Status</TableCell>
                <TableCell sx={{ width: '13%' }}>
                  <TableSortLabel
                    active={sortProperty === 'createdTime'}
                    direction={sortProperty === 'createdTime' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : 'asc'}
                    onClick={() => handleSort('createdTime')}
                  >
                    Created
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '20%', textAlign: 'right' }}>Operation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: tuyaColors.orange }} />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <DevicesOtherIcon sx={{ fontSize: 48, color: tuyaColors.textHint, mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography color="text.secondary">No devices found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((device) => (
                  <TableRow
                    key={device.id.id}
                    hover
                    onClick={() => navigate(`/entities/devices/${device.id.id}`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    {/* Device Name/ID */}
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {device.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: tuyaColors.textHint }}>
                          {device.id.id}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* UUID */}
                    <TableCell>
                      <Typography variant="caption" sx={{ color: tuyaColors.textHint }}>
                        {device.id.id.substring(0, 8)}...
                      </Typography>
                    </TableCell>

                    {/* Product (Device Profile) */}
                    <TableCell>
                      <Typography variant="body2">{device.deviceProfileName}</Typography>
                    </TableCell>

                    {/* Device Type */}
                    <TableCell>
                      <Typography variant="body2">{device.type || 'Common Device'}</Typography>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color: device.active ? tuyaColors.success : tuyaColors.textHint,
                          fontWeight: 500,
                        }}
                      >
                        {device.active ? 'Online' : 'Offline'}
                      </Typography>
                    </TableCell>

                    {/* Created */}
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(device.createdTime).toLocaleDateString('en-CA')}{' '}
                        {new Date(device.createdTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </TableCell>

                    {/* Operation */}
                    <TableCell sx={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Credentials">
                        <IconButton
                          size="small"
                          onClick={() => { setCredentialsDeviceId(device.id.id); setCredentialsDialogOpen(true); }}
                          sx={{ color: tuyaColors.info }}
                        >
                          <VpnKeyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => {
                            deviceApi.getDevice(device.id.id).then((d) => { setEditDevice(d); setDialogOpen(true); });
                          }}
                          sx={{ color: tuyaColors.textSecondary }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => { setDeviceToDelete(device); setDeleteDialogOpen(true); }}
                          sx={{ color: tuyaColors.error }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
