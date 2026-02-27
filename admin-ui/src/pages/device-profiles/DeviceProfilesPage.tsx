import { useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import StarIcon from '@mui/icons-material/Star';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import DeviceProfileDialog from './DeviceProfileDialog';
import { DeviceProfile } from '@/models/device.model';
import { deviceProfileApi } from '@/api/device-profile.api';
import { tuyaColors } from '@/theme/theme';

export default function DeviceProfilesPage() {
  const [data, setData] = useState<DeviceProfile[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<DeviceProfile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<DeviceProfile | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await deviceProfileApi.getDeviceProfiles({
        page,
        pageSize,
        textSearch: appliedSearch || undefined,
        sortProperty: 'createdTime',
        sortOrder: 'DESC',
      });
      setData(result.data);
      setTotalElements(result.totalElements);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = () => {
    setAppliedSearch(searchText);
    setPage(0);
  };

  const handleReset = () => {
    setSearchText('');
    setAppliedSearch('');
    setPage(0);
  };

  const handleSaved = () => {
    setDialogOpen(false);
    setEditProfile(null);
    loadData();
  };

  const handleDelete = async () => {
    if (toDelete) {
      await deviceProfileApi.deleteDeviceProfile(toDelete.id.id);
      setDeleteDialogOpen(false);
      setToDelete(null);
      loadData();
    }
  };

  const getTransportLabel = (profile: DeviceProfile): string => {
    switch (profile.transportType) {
      case 'MQTT': return 'Wi-Fi, Bluetooth LE';
      case 'COAP': return 'Bluetooth LE';
      case 'LWM2M': return 'Zigbee 3.0';
      default: return profile.transportType || 'DEFAULT';
    }
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" sx={{ mb: 0.5 }}>
          Product Development
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13px' }}>
          Manage your IoT products. After the product is created, the product can be configured through Function Definition,
          Device Interaction, Hardware Development, Product Configuration, Product Test.
        </Typography>
      </Box>

      {/* Tab: My Products */}
      <Box sx={{ mb: 2, borderBottom: `2px solid ${tuyaColors.border}` }}>
        <Box
          sx={{
            display: 'inline-block',
            px: 2,
            py: 1,
            borderBottom: `2px solid ${tuyaColors.orange}`,
            mb: '-2px',
          }}
        >
          <Typography variant="subtitle1" sx={{ color: tuyaColors.orange, fontWeight: 600 }}>
            My Products
          </Typography>
        </Box>
      </Box>

      {/* Filter Bar */}
      <Paper elevation={0} sx={{ p: '12px 0', mb: 0, boxShadow: 'none', borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Product ID / Product Name"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: tuyaColors.textHint }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: 200 }}
          />
          <Button variant="outlined" onClick={handleSearch} sx={{ minWidth: 64, height: 32, color: tuyaColors.textSecondary, borderColor: tuyaColors.border }}>
            Search
          </Button>
          <Button
            variant="outlined"
            onClick={handleReset}
            sx={{ minWidth: 64, height: 32, color: tuyaColors.textSecondary, borderColor: tuyaColors.border }}
          >
            Reset
          </Button>

          <Box sx={{ flex: 1 }} />

          <Button
            variant="contained"
            onClick={() => { setEditProfile(null); setDialogOpen(true); }}
            sx={{ height: 32 }}
          >
            Create
          </Button>
        </Box>
      </Paper>

      {/* Products Table */}
      <Paper elevation={0} sx={{ borderRadius: 0, boxShadow: 'none' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '32%' }}>Product Information</TableCell>
                <TableCell sx={{ width: '14%' }}>Product</TableCell>
                <TableCell sx={{ width: '14%' }}>Device Type</TableCell>
                <TableCell sx={{ width: '12%' }}>Status</TableCell>
                <TableCell sx={{ width: '14%' }}>Enabled At</TableCell>
                <TableCell sx={{ width: '14%', textAlign: 'right' }}>Operation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: tuyaColors.orange }} />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <DevicesOtherIcon sx={{ fontSize: 48, color: tuyaColors.textHint, mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography color="text.secondary">No products found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((profile) => (
                  <TableRow key={profile.id.id} hover>
                    {/* Product Information: icon + name + ID */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 40, height: 40, borderRadius: '8px',
                            bgcolor: '#F5F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `1px solid ${tuyaColors.border}`, flexShrink: 0,
                          }}
                        >
                          <DevicesOtherIcon sx={{ fontSize: 22, color: tuyaColors.textHint }} />
                        </Box>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {profile.name}
                            </Typography>
                            {profile.default && <StarIcon sx={{ fontSize: 16, color: tuyaColors.warning }} />}
                          </Box>
                          <Typography variant="caption" sx={{ color: tuyaColors.textHint }}>
                            Product ID: {profile.id.id.substring(0, 16)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Product (transport type) */}
                    <TableCell>
                      <Typography variant="body2">{getTransportLabel(profile)}</Typography>
                    </TableCell>

                    {/* Device Type */}
                    <TableCell>
                      <Typography variant="body2">Common Device</Typography>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Chip
                        label={profile.default ? 'Completed' : 'Developing'}
                        size="small"
                        sx={{
                          bgcolor: profile.default ? 'rgba(82,196,26,0.1)' : 'rgba(250,173,20,0.1)',
                          color: profile.default ? tuyaColors.success : tuyaColors.warning,
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>

                    {/* Enabled At */}
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(profile.createdTime).toLocaleDateString('en-CA')}
                      </Typography>
                    </TableCell>

                    {/* Operation */}
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => { setEditProfile(profile); setDialogOpen(true); }}
                        sx={{ color: tuyaColors.info, fontWeight: 500, mr: 0.5 }}
                      >
                        Manage
                      </Button>
                      {!profile.default && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => { setToDelete(profile); setDeleteDialogOpen(true); }}
                            sx={{ color: tuyaColors.error }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
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
      <DeviceProfileDialog
        open={dialogOpen} profile={editProfile}
        onClose={() => { setDialogOpen(false); setEditProfile(null); }}
        onSaved={handleSaved}
      />
      <ConfirmDialog
        open={deleteDialogOpen} title="Delete Product"
        content={`Are you sure you want to delete product "${toDelete?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteDialogOpen(false); setToDelete(null); }}
      />
    </Box>
  );
}
