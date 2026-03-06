import { useState, useEffect, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { smartHomeProductApi } from '@/api/smarthome-product.api';
import { tuyaColors } from '@/theme/theme';

interface StandardDp {
  dpId: number;
  code: string;
  name: string;
  dpType: string;
  mode: string;
  required?: boolean;
  constraints?: unknown;
}

interface Props {
  open: boolean;
  categoryId?: string;
  existingDpCodes: string[];
  onClose: () => void;
  onApply: (dps: StandardDp[]) => void;
}

export default function AddStandardFunctionDialog({
  open,
  categoryId,
  existingDpCodes,
  onClose,
  onApply,
}: Props) {
  const [activeTab, setActiveTab] = useState<'standard' | 'other'>('standard');
  const [loading, setLoading] = useState(false);
  const [standardDps, setStandardDps] = useState<StandardDp[]>([]);
  const [otherDps, setOtherDps] = useState<{ dp: StandardDp; categoryName: string }[]>([]);
  const [selected, setSelected] = useState<StandardDp[]>([]);
  const [searchText, setSearchText] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [dataTypeFilter, setDataTypeFilter] = useState('');

  // Load standard DPs from the product's own category
  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setSearchText('');
    setServiceFilter('');
    setDataTypeFilter('');
    setActiveTab('standard');

    const loadAll = async () => {
      setLoading(true);
      try {
        const catResult = await smartHomeProductApi.getCategories(0, 100);
        const allCategories = catResult.data;

        // Own category standard DPs
        if (categoryId) {
          const ownCat = allCategories.find((c) => c.id.id === categoryId);
          if (ownCat?.standardDpSet && Array.isArray(ownCat.standardDpSet)) {
            setStandardDps(ownCat.standardDpSet as StandardDp[]);
          } else {
            setStandardDps([]);
          }
        } else {
          setStandardDps([]);
        }

        // Other categories' DPs
        const others: { dp: StandardDp; categoryName: string }[] = [];
        for (const cat of allCategories) {
          if (cat.id.id === categoryId) continue;
          if (cat.standardDpSet && Array.isArray(cat.standardDpSet)) {
            for (const dp of cat.standardDpSet as StandardDp[]) {
              others.push({ dp, categoryName: cat.name });
            }
          }
        }
        setOtherDps(others);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [open, categoryId]);

  // Filter out already-applied DPs from standard list
  const availableStandard = useMemo(() => {
    return standardDps.filter(
      (dp) =>
        !existingDpCodes.includes(dp.code) &&
        !selected.some((s) => s.code === dp.code),
    );
  }, [standardDps, existingDpCodes, selected]);

  // Filter other DPs
  const filteredOther = useMemo(() => {
    return otherDps.filter(({ dp, categoryName }) => {
      if (existingDpCodes.includes(dp.code)) return false;
      if (selected.some((s) => s.code === dp.code)) return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        if (
          !dp.name.toLowerCase().includes(q) &&
          !dp.code.toLowerCase().includes(q)
        )
          return false;
      }
      if (serviceFilter && categoryName !== serviceFilter) return false;
      if (dataTypeFilter && dp.dpType !== dataTypeFilter) return false;
      return true;
    });
  }, [otherDps, existingDpCodes, selected, searchText, serviceFilter, dataTypeFilter]);

  // Unique category names for Service filter
  const serviceOptions = useMemo(() => {
    const names = new Set(otherDps.map(({ categoryName }) => categoryName));
    return Array.from(names).sort();
  }, [otherDps]);

  const dataTypeOptions = ['BOOLEAN', 'VALUE', 'ENUM', 'STRING', 'RAW', 'FAULT'];

  const handleSelectDp = (dp: StandardDp) => {
    if (!selected.some((s) => s.code === dp.code)) {
      setSelected([...selected, dp]);
    }
  };

  const handleRemoveDp = (dp: StandardDp) => {
    setSelected(selected.filter((s) => s.code !== dp.code));
  };

  const handleSelectAll = () => {
    const toAdd = availableStandard.filter(
      (dp) => !selected.some((s) => s.code === dp.code),
    );
    setSelected([...selected, ...toAdd]);
  };

  const handleRemoveOptional = () => {
    setSelected(selected.filter((s) => s.required));
  };

  const handleOk = () => {
    onApply(selected);
    onClose();
  };

  const tabSx = (active: boolean) => ({
    px: 2,
    py: 1.5,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: active ? tuyaColors.info : tuyaColors.textSecondary,
    borderBottom: active ? `2px solid ${tuyaColors.info}` : '2px solid transparent',
    mb: '-1px',
    '&:hover': { color: tuyaColors.info },
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{ sx: { width: 900, maxWidth: '95vw', height: 600 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 500 }}>Add Standard Function</Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel: tabs + list */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${tuyaColors.border}` }}>
          {/* Tabs */}
          <Box sx={{ display: 'flex', borderBottom: `1px solid ${tuyaColors.border}`, px: 1 }}>
            <Box onClick={() => setActiveTab('standard')} sx={tabSx(activeTab === 'standard')}>
              Standard Functions
            </Box>
            <Box onClick={() => setActiveTab('other')} sx={tabSx(activeTab === 'other')}>
              Other Functions
            </Box>
            {activeTab === 'standard' && availableStandard.length > 0 && (
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <Typography
                  onClick={handleSelectAll}
                  sx={{ fontSize: '13px', color: tuyaColors.info, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                >
                  Select All
                </Typography>
              </Box>
            )}
          </Box>

          {/* Filters for Other tab */}
          {activeTab === 'other' && (
            <Box sx={{ px: 2, pt: 1.5, pb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                size="small"
                placeholder="Please enter"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon sx={{ fontSize: 18, color: tuyaColors.textHint }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiInputBase-root': { height: 32, fontSize: '13px' } }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  select
                  size="small"
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  SelectProps={{ displayEmpty: true }}
                  sx={{ flex: 1, '& .MuiInputBase-root': { height: 32, fontSize: '13px' } }}
                >
                  <MenuItem value="">
                    <Typography sx={{ fontSize: '13px', color: tuyaColors.textHint }}>Service</Typography>
                  </MenuItem>
                  {serviceOptions.map((s) => (
                    <MenuItem key={s} value={s} sx={{ fontSize: '13px' }}>{s}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  value={dataTypeFilter}
                  onChange={(e) => setDataTypeFilter(e.target.value)}
                  SelectProps={{ displayEmpty: true }}
                  sx={{ flex: 1, '& .MuiInputBase-root': { height: 32, fontSize: '13px' } }}
                >
                  <MenuItem value="">
                    <Typography sx={{ fontSize: '13px', color: tuyaColors.textHint }}>Data Type</Typography>
                  </MenuItem>
                  {dataTypeOptions.map((t) => (
                    <MenuItem key={t} value={t} sx={{ fontSize: '13px' }}>{t}</MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
          )}

          {/* DP List */}
          <Box sx={{ flex: 1, overflow: 'auto', px: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={28} sx={{ color: tuyaColors.orange }} />
              </Box>
            ) : activeTab === 'standard' ? (
              availableStandard.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '13px', color: tuyaColors.textHint }}>
                    All standard functions have been added
                  </Typography>
                </Box>
              ) : (
                availableStandard.map((dp) => (
                  <DpRow
                    key={dp.code}
                    name={dp.name}
                    subtitle={`DP ID: ${dp.dpId}    Identifier: ${dp.code}`}
                    onSelect={() => handleSelectDp(dp)}
                  />
                ))
              )
            ) : (
              filteredOther.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '13px', color: tuyaColors.textHint }}>
                    No functions found
                  </Typography>
                </Box>
              ) : (
                filteredOther.map(({ dp, categoryName }) => (
                  <DpRow
                    key={`${categoryName}-${dp.code}`}
                    name={dp.name}
                    tag={categoryName}
                    subtitle={`Identifier: ${dp.code}    Function Type: ${dp.dpType}`}
                    onSelect={() => handleSelectDp(dp)}
                  />
                ))
              )
            )}
          </Box>
        </Box>

        {/* Right panel: selected */}
        <Box sx={{ width: 300, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: `1px solid ${tuyaColors.border}` }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
              Selected Function({selected.length})
            </Typography>
            {selected.some((s) => !s.required) && (
              <Typography
                onClick={handleRemoveOptional}
                sx={{ fontSize: '12px', color: tuyaColors.info, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              >
                Remove Optional Function
              </Typography>
            )}
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {selected.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '13px', color: tuyaColors.textHint }}>
                  No function is selected.
                </Typography>
              </Box>
            ) : (
              selected.map((dp) => (
                <Box
                  key={dp.code}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1.5,
                    borderBottom: `1px solid ${tuyaColors.border}`,
                    '&:hover': { bgcolor: '#f9f9f9' },
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: '14px', fontWeight: 400 }}>{dp.name}</Typography>
                    <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint }}>
                      DP ID: {dp.dpId}    Identifier: {dp.code}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => handleRemoveDp(dp)} sx={{ color: tuyaColors.textHint }}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: `1px solid ${tuyaColors.border}` }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ color: tuyaColors.textSecondary, borderColor: tuyaColors.border }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleOk}
          disabled={selected.length === 0}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DpRow({
  name,
  subtitle,
  tag,
  onSelect,
}: {
  name: string;
  subtitle: string;
  tag?: string;
  onSelect: () => void;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        borderBottom: `1px solid ${tuyaColors.border}`,
        cursor: 'pointer',
        '&:hover': { bgcolor: '#f5f7fa' },
      }}
      onClick={onSelect}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 400 }}>{name}</Typography>
          {tag && (
            <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint }}>{tag}</Typography>
          )}
        </Box>
        <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint, mt: 0.25 }}>
          {subtitle}
        </Typography>
      </Box>
      <ChevronRightIcon sx={{ fontSize: 20, color: tuyaColors.textHint, flexShrink: 0 }} />
    </Box>
  );
}
