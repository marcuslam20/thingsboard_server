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
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import { Customer, customerApi } from '@/api/customer.api';
import { tuyaColors } from '@/theme/theme';

export default function UserManagementPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Customer[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await customerApi.getCustomers({
        page,
        pageSize,
        textSearch: appliedSearch || undefined,
        sortProperty: 'createdTime',
        sortOrder: 'DESC',
      });
      setData(result.data);
      setTotalElements(result.totalElements);
    } catch (err) {
      console.error('Failed to load customers:', err);
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
    return new Date(ts).toLocaleDateString('en-CA') + ' ' + new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const shortenUid = (id: string): string => {
    return id.replace(/-/g, '').substring(0, 16);
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 400 }}>
          App User Management
        </Typography>
        <Chip
          label="China Data Center"
          size="small"
          variant="outlined"
          sx={{
            height: 28, fontSize: '12px',
            borderColor: tuyaColors.border,
            color: tuyaColors.textSecondary,
          }}
        />
      </Box>

      {/* Tab: All Apps */}
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
            All Apps
          </Typography>
        </Box>
      </Box>

      {/* Filter Bar */}
      <Paper elevation={0} sx={{ p: '10px 0', mb: 0, boxShadow: 'none', borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '12px', color: tuyaColors.textSecondary, mr: 0.5 }}>Enter:</Typography>
          <TextField
            size="small"
            placeholder="Search phone number/email/user name/UID"
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
              width: 320,
              '& .MuiInputBase-root': { height: 28, fontSize: '12px' },
              '& .MuiInputBase-input': { py: '3px' },
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{ minWidth: 0, px: 2, height: 28, fontSize: '12px' }}
          >
            Search
          </Button>
          <Button
            variant="outlined"
            onClick={handleReset}
            sx={{
              minWidth: 0, px: 2, height: 28, fontSize: '12px',
              color: tuyaColors.textSecondary, borderColor: tuyaColors.border,
            }}
          >
            Reset
          </Button>

          <Box sx={{ flex: 1 }} />

          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />}
            sx={{
              height: 28, fontSize: '12px', px: 1.5,
              color: tuyaColors.textSecondary, borderColor: tuyaColors.border,
            }}
          >
            Export Data
          </Button>
        </Box>
      </Paper>

      {/* Users Table */}
      <Paper elevation={0} sx={{ borderRadius: 0, boxShadow: 'none', mt: 1 }}>
        <TableContainer>
          <Table sx={{ '& td': { fontSize: '12px' }, '& th': { fontSize: '12px' } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '8%', fontWeight: 500 }}>App</TableCell>
                <TableCell sx={{ width: '14%', fontWeight: 500 }}>UID</TableCell>
                <TableCell sx={{ width: '16%', fontWeight: 500 }}>User Account</TableCell>
                <TableCell sx={{ width: '13%', fontWeight: 500 }}>Bind Phone Number</TableCell>
                <TableCell sx={{ width: '16%', fontWeight: 500 }}>Bind Email</TableCell>
                <TableCell sx={{ width: '10%', fontWeight: 500 }}>User Name</TableCell>
                <TableCell sx={{ width: '13%', fontWeight: 500 }}>Registration Time</TableCell>
                <TableCell sx={{ width: '10%', fontWeight: 500 }}>Bound Devices</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: tuyaColors.orange }} />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <PeopleOutlineIcon sx={{ fontSize: 48, color: tuyaColors.textHint, mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography color="text.secondary" sx={{ fontSize: '13px' }}>No users found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((customer) => (
                  <TableRow
                    key={customer.id.id}
                    hover
                    onClick={() => navigate(`/customers/${customer.id.id}`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    {/* App */}
                    <TableCell>
                      <Typography sx={{ fontSize: '12px', color: tuyaColors.textPrimary }}>
                        Osprey
                      </Typography>
                    </TableCell>

                    {/* UID */}
                    <TableCell>
                      <Typography sx={{ fontSize: '12px', color: tuyaColors.textSecondary, fontFamily: 'monospace' }}>
                        {shortenUid(customer.id.id)}
                      </Typography>
                    </TableCell>

                    {/* User Account */}
                    <TableCell>
                      <Typography sx={{ fontSize: '12px', color: tuyaColors.textPrimary }}>
                        {customer.email || customer.name || '—'}
                      </Typography>
                    </TableCell>

                    {/* Bind Phone Number */}
                    <TableCell>
                      <Typography sx={{ fontSize: '12px', color: tuyaColors.textSecondary }}>
                        {customer.phone || '—'}
                      </Typography>
                    </TableCell>

                    {/* Bind Email */}
                    <TableCell>
                      <Typography sx={{ fontSize: '12px', color: tuyaColors.info }}>
                        {customer.email || '—'}
                      </Typography>
                    </TableCell>

                    {/* User Name */}
                    <TableCell>
                      <Typography sx={{ fontSize: '12px', color: tuyaColors.textPrimary }}>
                        {customer.title || '—'}
                      </Typography>
                    </TableCell>

                    {/* Registration Time */}
                    <TableCell>
                      <Typography sx={{ fontSize: '12px', color: tuyaColors.textSecondary }}>
                        {formatDate(customer.createdTime)}
                      </Typography>
                    </TableCell>

                    {/* Bound Devices */}
                    <TableCell>
                      <Typography
                        component="a"
                        href={`/operation/appUser?uid=${customer.id.id}&ac=${encodeURIComponent(customer.email || customer.name || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        sx={{
                          fontSize: '12px',
                          color: tuyaColors.info,
                          textDecoration: 'none',
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        View Detail
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, borderTop: `1px solid ${tuyaColors.border}` }}>
          <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint }}>
            {totalElements} records found
          </Typography>
          <TablePagination
            component="div"
            count={totalElements}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 20, 50]}
            sx={{ '& .MuiTablePagination-toolbar': { minHeight: 36 }, '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '12px' } }}
          />
        </Box>
      </Paper>
    </Box>
  );
}
