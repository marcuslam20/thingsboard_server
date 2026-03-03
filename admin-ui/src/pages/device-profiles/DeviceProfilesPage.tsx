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
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Link from '@mui/material/Link';
import SearchIcon from '@mui/icons-material/Search';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FilterListIcon from '@mui/icons-material/FilterList';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import StarIcon from '@mui/icons-material/Star';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import SortIcon from '@mui/icons-material/Sort';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import DeviceProfileDialog from './DeviceProfileDialog';
import { DeviceProfile } from '@/models/device.model';
import { ProductCategory } from '@/models/datapoint.model';
import { deviceProfileApi } from '@/api/device-profile.api';
import { smartHomeProductApi } from '@/api/smarthome-product.api';
import { tuyaColors } from '@/theme/theme';

export default function DeviceProfilesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DeviceProfile[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<DeviceProfile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<DeviceProfile | null>(null);

  // More menu ("...")
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuProfile, setMenuProfile] = useState<DeviceProfile | null>(null);

  // Fetch categories on mount for category name lookup
  useEffect(() => {
    smartHomeProductApi.getCategories(0, 100)
      .then((result) => setCategories(result.data))
      .catch(() => setCategories([]));
  }, []);

  const getCategoryName = (profile: DeviceProfile): string | null => {
    if (!profile.categoryId?.id) return null;
    const cat = categories.find((c) => c.id.id === profile.categoryId?.id);
    return cat?.name || null;
  };

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

  const formatDate = (ts: number): string => {
    return new Date(ts).toLocaleDateString('en-CA');
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
            px: 0,
            py: 1,
            borderBottom: `2px solid ${tuyaColors.orangeDark}`,
            mb: '-2px',
          }}
        >
          <Typography variant="subtitle1" sx={{ color: tuyaColors.orangeDark, fontWeight: 500 }}>
            My Products
          </Typography>
        </Box>
      </Box>

      {/* Filter Bar */}
      <Paper elevation={0} sx={{ p: '8px 0', mb: 0, boxShadow: 'none', borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          {/* Filter chips */}
          <Chip
            icon={<LocalOfferOutlinedIcon sx={{ fontSize: 12 }} />}
            label="Tag"
            size="small"
            variant="outlined"
            sx={{
              height: 24, fontSize: '11px', borderColor: tuyaColors.border,
              color: tuyaColors.textSecondary, '& .MuiChip-icon': { color: tuyaColors.textHint, ml: '4px' },
              '& .MuiChip-label': { px: '6px' },
            }}
          />
          <Chip
            icon={<TuneIcon sx={{ fontSize: 12 }} />}
            label="Filter"
            size="small"
            variant="outlined"
            sx={{
              height: 24, fontSize: '11px', borderColor: tuyaColors.border,
              color: tuyaColors.textSecondary, '& .MuiChip-icon': { color: tuyaColors.textHint, ml: '4px' },
              '& .MuiChip-label': { px: '6px' },
            }}
          />
          <Chip
            icon={<SortIcon sx={{ fontSize: 12 }} />}
            label="Creation Time - Descending"
            size="small"
            variant="outlined"
            sx={{
              height: 24, fontSize: '11px', borderColor: tuyaColors.border,
              color: tuyaColors.textSecondary, '& .MuiChip-icon': { color: tuyaColors.textHint, ml: '4px' },
              '& .MuiChip-label': { px: '6px' },
            }}
          />

          <TextField
            size="small"
            placeholder="Product ID / Product Name"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: tuyaColors.textHint }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 160,
              '& .MuiInputBase-root': { height: 24, fontSize: '11px' },
              '& .MuiInputBase-input': { py: '2px' },
            }}
          />
          <Button
            variant="outlined"
            onClick={handleSearch}
            sx={{ minWidth: 0, px: 1, height: 24, fontSize: '11px', color: tuyaColors.textSecondary, borderColor: tuyaColors.border }}
          >
            Search
          </Button>
          <Button
            variant="outlined"
            onClick={handleReset}
            sx={{ minWidth: 0, px: 1, height: 24, fontSize: '11px', color: tuyaColors.textSecondary, borderColor: tuyaColors.border }}
          >
            Reset
          </Button>

          <Box sx={{ flex: 1 }} />

          <Button
            variant="contained"
            onClick={() => { setEditProfile(null); setDialogOpen(true); }}
            sx={{ height: 24, fontSize: '11px', px: 1.5 }}
          >
            Create
          </Button>
        </Box>
      </Paper>

      {/* Products Table */}
      <Paper elevation={0} sx={{ borderRadius: 0, boxShadow: 'none' }}>
        <TableContainer>
          <Table sx={{ '& td': { fontSize: '11px' }, '& th': { fontSize: '12px' } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '28%' }}>Product Information</TableCell>
                <TableCell sx={{ width: '12%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Protocol
                    <FilterListIcon sx={{ fontSize: 14, color: tuyaColors.textHint, cursor: 'pointer' }} />
                  </Box>
                </TableCell>
                <TableCell sx={{ width: '10%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Device Type
                    <FilterListIcon sx={{ fontSize: 14, color: tuyaColors.textHint, cursor: 'pointer' }} />
                  </Box>
                </TableCell>
                <TableCell sx={{ width: '10%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Status
                    <FilterListIcon sx={{ fontSize: 14, color: tuyaColors.textHint, cursor: 'pointer' }} />
                  </Box>
                </TableCell>
                <TableCell sx={{ width: '11%' }}>Created At</TableCell>
                <TableCell sx={{ width: '11%' }}>Last Updated</TableCell>
                <TableCell sx={{ width: '14%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a1a1a', fontSize: '12px', mr: 'auto', pl: 2 }}>
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
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: tuyaColors.orange }} />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <DevicesOtherIcon sx={{ fontSize: 48, color: tuyaColors.textHint, mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography color="text.secondary">No products found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((profile) => {
                  const catName = getCategoryName(profile);
                  return (
                    <TableRow key={profile.id.id} hover>
                      {/* Product Information: icon + name + category subtitle + ID */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 36, height: 36, borderRadius: '6px',
                              bgcolor: '#F5F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: `1px solid ${tuyaColors.border}`, flexShrink: 0,
                            }}
                          >
                            <DevicesOtherIcon sx={{ fontSize: 18, color: tuyaColors.textHint }} />
                          </Box>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography sx={{ fontWeight: 400, fontSize: '12px', color: tuyaColors.orangeDark }}>
                                {profile.name}
                              </Typography>
                              {profile.default && <StarIcon sx={{ fontSize: 13, color: tuyaColors.warning }} />}
                            </Box>
                            {catName && (
                              <Typography sx={{ fontSize: '10px', color: tuyaColors.textSecondary, display: 'block', lineHeight: 1.4 }}>
                                Custom | {catName}
                              </Typography>
                            )}
                            <Typography sx={{ fontSize: '10px', color: tuyaColors.textHint }}>
                              Product ID: {profile.id.id.substring(0, 16)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Protocol */}
                      <TableCell>{getTransportLabel(profile)}</TableCell>

                      {/* Device Type */}
                      <TableCell>Common Device</TableCell>

                      {/* Status */}
                      <TableCell>
                        <Chip
                          label={profile.default ? 'Completed' : 'Developing'}
                          size="small"
                          sx={{
                            height: 20, fontSize: '10px',
                            bgcolor: profile.default ? 'rgba(82,196,26,0.1)' : 'rgba(250,173,20,0.1)',
                            color: profile.default ? tuyaColors.success : tuyaColors.warning,
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>

                      {/* Created At */}
                      <TableCell>{formatDate(profile.createdTime)}</TableCell>

                      {/* Last Updated */}
                      <TableCell>{formatDate(profile.createdTime)}</TableCell>

                      {/* Operation — stacked: Develop / Manage ∨ / ... */}
                      <TableCell sx={{ textAlign: 'right', verticalAlign: 'top', pt: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75 }}>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => navigate(`/profiles/deviceProfiles/${profile.id.id}`)}
                            sx={{
                              fontSize: '11px',
                              fontWeight: 400,
                              height: 22,
                              minWidth: 0,
                              px: 1,
                              bgcolor: tuyaColors.orangeDark,
                              textTransform: 'none',
                              '&:hover': { bgcolor: '#003A70' },
                            }}
                          >
                            {profile.default ? 'Details' : 'Develop'}
                          </Button>

                          <Link
                            component="button"
                            variant="body2"
                            onClick={() => { setEditProfile(profile); setDialogOpen(true); }}
                            sx={{
                              color: tuyaColors.orangeDark,
                              fontSize: '11px',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              cursor: 'pointer',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            Manage
                            <KeyboardArrowDownIcon sx={{ fontSize: 13, ml: 0.25 }} />
                          </Link>

                          <IconButton
                            size="small"
                            onClick={(e) => { setMenuAnchor(e.currentTarget); setMenuProfile(profile); }}
                            sx={{ color: tuyaColors.textHint, p: 0.25 }}
                          >
                            <MoreHorizIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
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

      {/* More menu (triggered by "...") */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => { setMenuAnchor(null); setMenuProfile(null); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 120, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' } } }}
      >
        <MenuItem
          onClick={() => {
            setToDelete(menuProfile);
            setDeleteDialogOpen(true);
            setMenuAnchor(null);
            setMenuProfile(null);
          }}
          disabled={menuProfile?.default}
          sx={{ fontSize: '13px', color: menuProfile?.default ? tuyaColors.textHint : tuyaColors.textPrimary }}
        >
          Delete
        </MenuItem>
      </Menu>

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
