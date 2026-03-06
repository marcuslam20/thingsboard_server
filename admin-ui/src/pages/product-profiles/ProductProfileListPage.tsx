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
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import { DeviceProfile } from '@/models/device.model';
import { deviceProfileApi } from '@/api/device-profile.api';
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

export default function ProductProfileListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DeviceProfile[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
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

  const formatDate = (ts: number): string => {
    return new Date(ts).toLocaleDateString('en-CA');
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" sx={{ mb: 0.5 }}>
          Product Profile
        </Typography>
      </Box>

      {/* Filter Bar */}
      <Paper elevation={0} sx={{ p: '8px 0', mb: 0, boxShadow: 'none', borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search by Product ID/PI"
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
              width: 220,
              '& .MuiInputBase-root': { height: 32, fontSize: '13px' },
              '& .MuiInputBase-input': { py: '4px' },
            }}
          />
          <Button
            variant="outlined"
            onClick={handleSearch}
            sx={{ minWidth: 0, px: 2, height: 32, fontSize: '13px', color: tuyaColors.textPrimary, borderColor: tuyaColors.border }}
          >
            Search
          </Button>
          <Button
            variant="outlined"
            onClick={handleReset}
            sx={{ minWidth: 0, px: 2, height: 32, fontSize: '13px', color: tuyaColors.textSecondary, borderColor: tuyaColors.border }}
          >
            Reset
          </Button>

          <Box sx={{ flex: 1 }} />

          <Button
            variant="outlined"
            sx={{ height: 32, fontSize: '13px', px: 2, color: tuyaColors.orange, borderColor: tuyaColors.orange }}
          >
            Multi-Language
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 0, boxShadow: 'none', mt: 1 }}>
        <TableContainer>
          <Table sx={{ '& td': { fontSize: '13px' }, '& th': { fontSize: '13px', fontWeight: 500, color: tuyaColors.textSecondary } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafafa' }}>
                <TableCell sx={{ width: '24%' }}>Product Name / ID</TableCell>
                <TableCell sx={{ width: '12%' }}>Device Type</TableCell>
                <TableCell sx={{ width: '12%' }}>Development Status</TableCell>
                <TableCell sx={{ width: '12%' }}>Created At</TableCell>
                <TableCell sx={{ width: '12%' }}>Profile Status</TableCell>
                <TableCell sx={{ width: '12%' }}>Brand</TableCell>
                <TableCell sx={{ width: '16%' }}>Operation</TableCell>
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
                  const imagePath = resolveImagePath(profile.image);
                  return (
                    <TableRow key={profile.id.id} hover>
                      {/* Product Name / ID */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          {imagePath ? (
                            <Box sx={{ width: 36, height: 36, flexShrink: 0 }}>
                              <AuthImage src={imagePath} size={36} />
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                width: 36, height: 36, borderRadius: '6px',
                                bgcolor: '#F5F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: `1px solid ${tuyaColors.border}`, flexShrink: 0,
                              }}
                            >
                              <DevicesOtherIcon sx={{ fontSize: 18, color: tuyaColors.textHint }} />
                            </Box>
                          )}
                          <Box>
                            <Typography sx={{ fontWeight: 400, fontSize: '13px', color: tuyaColors.textPrimary }}>
                              {profile.name}
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: tuyaColors.textHint }}>
                              {profile.id.id.substring(0, 16)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Device Type */}
                      <TableCell>Common Device</TableCell>

                      {/* Development Status */}
                      <TableCell>
                        <Chip
                          label={profile.default ? 'Completed' : 'Developing'}
                          size="small"
                          sx={{
                            height: 22, fontSize: '12px',
                            bgcolor: profile.default ? 'rgba(82,196,26,0.1)' : 'rgba(250,173,20,0.1)',
                            color: profile.default ? tuyaColors.success : tuyaColors.warning,
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>

                      {/* Created At */}
                      <TableCell>{formatDate(profile.createdTime)}</TableCell>

                      {/* Profile Status */}
                      <TableCell>
                        <Typography sx={{ fontSize: '13px', color: tuyaColors.textHint }}>-</Typography>
                      </TableCell>

                      {/* Brand */}
                      <TableCell>
                        <Typography sx={{ fontSize: '13px', color: tuyaColors.textHint }}>-</Typography>
                      </TableCell>

                      {/* Operation */}
                      <TableCell>
                        <Typography
                          component="span"
                          onClick={() => navigate(`/operation/productFiles/${profile.id.id}/edit`)}
                          sx={{
                            fontSize: '13px',
                            color: tuyaColors.info,
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          Edit Product Profile
                        </Typography>
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
    </Box>
  );
}
