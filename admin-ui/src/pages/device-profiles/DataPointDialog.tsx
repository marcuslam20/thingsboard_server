import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataPoint, DpType, DpMode, ValueConstraints, EnumConstraints, StringConstraints } from '@/models/datapoint.model';
import { smartHomeProductApi } from '@/api/smarthome-product.api';

interface Props {
  open: boolean;
  deviceProfileId: string;
  dataPoint: DataPoint | null;
  onClose: () => void;
  onSaved: () => void;
}

const DP_TYPE_KEYS: Record<string, string> = {
  [DpType.BOOLEAN]: 'datapoint.bool',
  [DpType.VALUE]: 'datapoint.value',
  [DpType.ENUM]: 'datapoint.enum',
  [DpType.STRING]: 'datapoint.string',
  [DpType.RAW]: 'datapoint.raw',
  [DpType.FAULT]: 'datapoint.fault',
};

const DP_MODE_KEYS: Record<string, string> = {
  [DpMode.RW]: 'datapoint.rw',
  [DpMode.RO]: 'datapoint.ro',
  [DpMode.WO]: 'datapoint.wo',
};

export default function DataPointDialog({ open, deviceProfileId, dataPoint, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const isEdit = !!dataPoint;

  const [dpId, setDpId] = useState(1);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [dpType, setDpType] = useState<DpType>(DpType.BOOLEAN);
  const [mode, setMode] = useState<DpMode>(DpMode.RW);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // VALUE constraints
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(100);
  const [step, setStep] = useState(1);
  const [scale, setScale] = useState(0);
  const [unit, setUnit] = useState('');

  // ENUM constraints
  const [enumValues, setEnumValues] = useState<string[]>(['']);

  // STRING constraints
  const [maxLen, setMaxLen] = useState(255);

  useEffect(() => {
    if (open) {
      if (dataPoint) {
        setDpId(dataPoint.dpId);
        setName(dataPoint.name);
        setCode(dataPoint.code);
        setDpType(dataPoint.dpType);
        setMode(dataPoint.mode);
        loadConstraints(dataPoint);
      } else {
        setDpId(1);
        setName('');
        setCode('');
        setDpType(DpType.BOOLEAN);
        setMode(DpMode.RW);
        setMin(0);
        setMax(100);
        setStep(1);
        setScale(0);
        setUnit('');
        setEnumValues(['']);
        setMaxLen(255);
      }
      setError('');
    }
  }, [open, dataPoint]);

  const loadConstraints = (dp: DataPoint) => {
    const c = dp.constraints || {};
    if (dp.dpType === DpType.VALUE) {
      const vc = c as ValueConstraints;
      setMin(vc.min ?? 0);
      setMax(vc.max ?? 100);
      setStep(vc.step ?? 1);
      setScale(vc.scale ?? 0);
      setUnit(vc.unit ?? '');
    } else if (dp.dpType === DpType.ENUM) {
      const ec = c as EnumConstraints;
      setEnumValues(ec.range && ec.range.length > 0 ? ec.range : ['']);
    } else if (dp.dpType === DpType.STRING) {
      const sc = c as StringConstraints;
      setMaxLen(sc.maxlen ?? 255);
    }
  };

  const buildConstraints = (): Record<string, unknown> | null => {
    switch (dpType) {
      case DpType.VALUE:
        return { min, max, step, scale, unit: unit || undefined };
      case DpType.ENUM:
        return { range: enumValues.filter((v) => v.trim() !== '') };
      case DpType.STRING:
        return { maxlen: maxLen };
      default:
        return null;
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t('datapoint.name-required'));
      return;
    }
    if (!code.trim()) {
      setError(t('datapoint.code-required'));
      return;
    }
    if (dpId < 1 || dpId > 255) {
      setError(t('datapoint.dp-id-range'));
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload: Partial<DataPoint> = {
        dpId,
        name: name.trim(),
        code: code.trim(),
        dpType,
        mode,
        constraints: buildConstraints(),
        standard: false,
        sortOrder: dpId,
      };
      if (dataPoint?.id) {
        payload.id = dataPoint.id;
      }
      await smartHomeProductApi.saveDataPoint(deviceProfileId, payload);
      onSaved();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('datapoint.save-failed');
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const addEnumValue = () => setEnumValues([...enumValues, '']);
  const removeEnumValue = (idx: number) => setEnumValues(enumValues.filter((_, i) => i !== idx));
  const updateEnumValue = (idx: number, val: string) => {
    const copy = [...enumValues];
    copy[idx] = val;
    setEnumValues(copy);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? t('datapoint.edit') : t('datapoint.add')}</DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label={t('datapoint.dp-id')}
            type="number"
            value={dpId}
            onChange={(e) => setDpId(Number(e.target.value))}
            inputProps={{ min: 1, max: 255 }}
            size="small"
            fullWidth
          />
          <TextField
            label={t('datapoint.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label={t('datapoint.code')}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            size="small"
            fullWidth
            helperText={t('datapoint.code-hint')}
          />
          <TextField
            label={t('datapoint.dp-type')}
            select
            value={dpType}
            onChange={(e) => setDpType(e.target.value as DpType)}
            size="small"
            fullWidth
          >
            {Object.values(DpType).map((val) => (
              <MenuItem key={val} value={val}>{t(DP_TYPE_KEYS[val])}</MenuItem>
            ))}
          </TextField>
          <TextField
            label={t('datapoint.dp-mode')}
            select
            value={mode}
            onChange={(e) => setMode(e.target.value as DpMode)}
            size="small"
            fullWidth
          >
            {Object.values(DpMode).map((val) => (
              <MenuItem key={val} value={val}>{t(DP_MODE_KEYS[val])}</MenuItem>
            ))}
          </TextField>

          {/* Dynamic constraints */}
          {dpType === DpType.VALUE && (
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>{t('datapoint.value-properties')}</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <TextField label={t('datapoint.min')} type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} size="small" />
                <TextField label={t('datapoint.max')} type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} size="small" />
                <TextField label={t('datapoint.step')} type="number" value={step} onChange={(e) => setStep(Number(e.target.value))} size="small" />
                <TextField label={t('datapoint.scale')} type="number" value={scale} onChange={(e) => setScale(Number(e.target.value))} size="small" />
                <TextField label={t('datapoint.unit')} value={unit} onChange={(e) => setUnit(e.target.value)} size="small" sx={{ gridColumn: 'span 2' }} />
              </Box>
            </Box>
          )}

          {dpType === DpType.ENUM && (
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle2">{t('datapoint.enum-values')}</Typography>
                <IconButton size="small" onClick={addEnumValue}><AddIcon fontSize="small" /></IconButton>
              </Box>
              {enumValues.map((val, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder={`Value ${idx}`}
                    value={val}
                    onChange={(e) => updateEnumValue(idx, e.target.value)}
                  />
                  {enumValues.length > 1 && (
                    <IconButton size="small" onClick={() => removeEnumValue(idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {dpType === DpType.STRING && (
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>{t('datapoint.string-properties')}</Typography>
              <TextField label={t('datapoint.max-length')} type="number" value={maxLen} onChange={(e) => setMaxLen(Number(e.target.value))} size="small" fullWidth />
            </Box>
          )}

          {error && (
            <Typography color="error" variant="body2">{error}</Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>{t('action.cancel')}</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? t('datapoint.saving') : isEdit ? t('datapoint.update') : t('datapoint.add-btn')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
