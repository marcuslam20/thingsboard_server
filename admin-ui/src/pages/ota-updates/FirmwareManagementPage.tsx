import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import OtaUpdateDialog from './OtaUpdateDialog';
import { OtaPackageInfo, otaUpdateApi } from '@/api/ota-update.api';
import { tuyaColors } from '@/theme/theme';

const compactInputSx = {
  '& .MuiInputBase-root': { height: 28, fontSize: '12px' },
  '& .MuiInputBase-input': { py: '4px', px: '8px' },
};

const compactSelectSx = {
  height: 28,
  fontSize: '12px',
  '& .MuiSelect-select': { py: '4px', px: '8px' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: tuyaColors.border },
};

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString('en-CA');
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${date} ${time}`;
}

export default function FirmwareManagementPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<OtaPackageInfo[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [sortProperty, setSortProperty] = useState('createdTime');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Filters
  const [searchName, setSearchName] = useState('');
  const [searchKey, setSearchKey] = useState('');
  const [searchProductId, setSearchProductId] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPkg, setEditPkg] = useState<OtaPackageInfo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<OtaPackageInfo | null>(null);

  // Row menu
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuRow, setMenuRow] = useState<OtaPackageInfo | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await otaUpdateApi.getOtaPackagesV2({
        page,
        pageSize,
        textSearch: appliedSearch || undefined,
        sortProperty,
        sortOrder,
      });
      setData(result.data);
      setTotalElements(result.totalElements);
    } catch {
      setData([]);
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
    setSearchKey('');
    setSearchProductId('');
    setTypeFilter('all');
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

  const handleDelete = async () => {
    if (toDelete) {
      await otaUpdateApi.deleteOtaPackage(toDelete.id.id);
      setDeleteDialogOpen(false);
      setToDelete(null);
      loadData();
    }
  };

  const handleSaved = () => {
    setDialogOpen(false);
    setEditPkg(null);
    loadData();
  };

  // Client-side filtering for key and product ID (TB API doesn't support these filters)
  const filteredData = data.filter((pkg) => {
    if (searchKey && !pkg.id.id.toLowerCase().includes(searchKey.toLowerCase())) return false;
    if (searchProductId && !(pkg.deviceProfileId?.id || '').toLowerCase().includes(searchProductId.toLowerCase())) return false;
    if (typeFilter !== 'all' && pkg.type !== typeFilter) return false;
    return true;
  });

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 0.5 }}>
        <Typography variant="h5" sx={{ mb: 0.5 }}>{t('firmware.management-title')}</Typography>
        <Link href="#" sx={{ fontSize: '12px', color: tuyaColors.info, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
          {t('firmware.management-view-docs')}
        </Link>
      </Box>

      {/* Tab: My Firmware */}
      <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${tuyaColors.border}`, mb: 2 }}>
        <Box
          sx={{
            px: 2, py: 1, cursor: 'pointer', fontSize: '13px', fontWeight: 500,
            color: tuyaColors.info,
            borderBottom: `2px solid ${tuyaColors.info}`,
            mb: '-1px',
          }}
        >
          {t('firmware.my-firmware')}
        </Box>
      </Box>

      {/* Filter Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder={t('firmware.enter-name')}
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          sx={{ width: 150, ...compactInputSx }}
        />
        <TextField
          size="small"
          placeholder={t('firmware.enter-key')}
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
          sx={{ width: 150, ...compactInputSx }}
        />
        <TextField
          size="small"
          placeholder={t('firmware.enter-product-id')}
          value={searchProductId}
          onChange={(e) => setSearchProductId(e.target.value)}
          sx={{ width: 150, ...compactInputSx }}
        />
        <Select
          size="small"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          sx={{ ...compactSelectSx, minWidth: 130 }}
        >
          <MenuItem value="all" sx={{ fontSize: '12px' }}>{t('firmware.firmware-type')}</MenuItem>
          <MenuItem value="FIRMWARE" sx={{ fontSize: '12px' }}>{t('firmware.firmware')}</MenuItem>
          <MenuItem value="SOFTWARE" sx={{ fontSize: '12px' }}>{t('firmware.software')}</MenuItem>
        </Select>

        <Button
          variant="outlined"
          onClick={handleSearch}
          sx={{ height: 28, fontSize: '12px', px: 2, color: tuyaColors.textPrimary, borderColor: tuyaColors.border }}
        >
          {t('action.search')}
        </Button>
        <Button
          variant="outlined"
          onClick={handleReset}
          sx={{ height: 28, fontSize: '12px', px: 2, color: tuyaColors.textPrimary, borderColor: tuyaColors.border }}
        >
          {t('action.reset')}
        </Button>

        <Box sx={{ flex: 1 }} />

        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: 16 }} />}
          onClick={() => { setEditPkg(null); setDialogOpen(true); }}
          sx={{ height: 32, fontSize: '13px', px: 2 }}
        >
          {t('firmware.add')}
        </Button>
      </Box>

      {/* Table */}
      <Paper elevation={0} sx={{ border: `1px solid ${tuyaColors.border}`, borderRadius: 1 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '14%' }}>{t('firmware.key')}</TableCell>
                <TableCell sx={{ width: '12%' }}>{t('firmware.initial-product-id')}</TableCell>
                <TableCell sx={{ width: '8%' }}>{t('firmware.correlation-product')}</TableCell>
                <TableCell sx={{ width: '14%' }}>
                  <TableSortLabel
                    active={sortProperty === 'title'}
                    direction={sortProperty === 'title' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : 'asc'}
                    onClick={() => handleSort('title')}
                  >
                    {t('firmware.name')}
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '10%' }}>{t('firmware.type')}</TableCell>
                <TableCell sx={{ width: '10%' }}>{t('firmware.data-uploaded')}</TableCell>
                <TableCell sx={{ width: '8%' }}>{t('firmware.latest-version')}</TableCell>
                <TableCell sx={{ width: '14%' }}>
                  <TableSortLabel
                    active={sortProperty === 'createdTime'}
                    direction={sortProperty === 'createdTime' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : 'asc'}
                    onClick={() => handleSort('createdTime')}
                  >
                    {t('firmware.creation-update-time')}
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '10%', textAlign: 'right' }}>{t('device.operation')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ color: tuyaColors.orange }} />
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" sx={{ color: tuyaColors.textHint }}>{t('firmware.no-firmware')}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((pkg) => (
                  <TableRow key={pkg.id.id} hover>
                    <TableCell>
                      <Typography sx={{ fontSize: '12px', color: tuyaColors.textPrimary }}>{pkg.id.id.substring(0, 16)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '12px', color: tuyaColors.textSecondary }}>
                        {pkg.deviceProfileId?.id ? pkg.deviceProfileId.id.substring(0, 12) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '12px', color: tuyaColors.info }}>
                        {pkg.deviceProfileName ? '1' : '0'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '12px', color: tuyaColors.textPrimary }}>{pkg.title}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '12px' }}>{pkg.type === 'FIRMWARE' ? t('firmware.mcu-firmware') : t('firmware.software')}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '12px', color: pkg.hasData ? tuyaColors.textPrimary : tuyaColors.textHint }}>
                        {pkg.hasData ? t('firmware.yes') : t('firmware.no')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '12px' }}>{pkg.version || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '11px', color: tuyaColors.textSecondary }}>
                        {formatDateTime(pkg.createdTime)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Link
                          component="button"
                          onClick={() => { setEditPkg(pkg); setDialogOpen(true); }}
                          sx={{ color: tuyaColors.info, fontSize: '12px', textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {t('firmware.details')}
                        </Link>
                        <Link
                          component="button"
                          onClick={() => { setEditPkg(null); setDialogOpen(true); }}
                          sx={{ color: tuyaColors.info, fontSize: '12px', textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {t('firmware.create-version')}
                        </Link>
                        <IconButton
                          size="small"
                          onClick={(e) => { setMenuAnchor(e.currentTarget); setMenuRow(pkg); }}
                          sx={{ p: 0.25, color: tuyaColors.textHint }}
                        >
                          <MoreHorizIcon sx={{ fontSize: 16 }} />
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

      {/* Row context menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => { setMenuAnchor(null); setMenuRow(null); }}
      >
        <MenuItem
          onClick={() => { setToDelete(menuRow); setDeleteDialogOpen(true); setMenuAnchor(null); setMenuRow(null); }}
          sx={{ fontSize: '12px', color: tuyaColors.error }}
        >
          {t('action.delete')}
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <OtaUpdateDialog
        open={dialogOpen}
        otaPackage={editPkg}
        onClose={() => { setDialogOpen(false); setEditPkg(null); }}
        onSaved={handleSaved}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        title={t('firmware.delete-title')}
        content={t('firmware.delete-confirm')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteDialogOpen(false); setToDelete(null); }}
      />
    </Box>
  );
}
