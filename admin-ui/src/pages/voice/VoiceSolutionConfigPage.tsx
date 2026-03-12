import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import { DeviceProfile } from '@/models/device.model';
import { DataPoint, DpMode } from '@/models/datapoint.model';
import { deviceProfileApi } from '@/api/device-profile.api';
import { deviceApi } from '@/api/device.api';
import { smartHomeProductApi } from '@/api/smarthome-product.api';
import { voiceApi } from '@/api/voice.api';
import { tuyaColors } from '@/theme/theme';

// ===================== Voice Feature Definitions =====================

interface VoiceFeature {
  id: string;
  featureName: string;
  description: string;
  utteranceExamples: string[];
  dpCodes: string[];
  supported: boolean;
}

const ALEXA_CATEGORIES: Record<string, string> = {
  dj: 'LIGHT', kg: 'SWITCH', cz: 'SMARTPLUG', wk: 'THERMOSTAT',
  fs: 'FAN', ms: 'SMARTLOCK', cl: 'INTERIOR_BLIND', cg: 'TEMPERATURE_SENSOR',
};

const GOOGLE_CATEGORIES: Record<string, string> = {
  dj: 'LIGHT', kg: 'SWITCH', cz: 'OUTLET', wk: 'THERMOSTAT',
  fs: 'FAN', ms: 'LOCK', cl: 'CURTAIN', cg: 'SENSOR',
};

function buildAvailableFeatures(platform: string): VoiceFeature[] {
  return [
    {
      id: 'power_onoff', featureName: 'Power On/Off',
      description: 'Turn device on or off',
      utteranceExamples: ['"turn on <device name>"', '"turn off <device name>"'],
      dpCodes: ['switch', 'switch_led', 'switch_1', 'control'], supported: false,
    },
    {
      id: 'brightness', featureName: 'Brightness',
      description: 'Set brightness level (0-100%)',
      utteranceExamples: ['"set <device name> brightness to 50"', '"dim <device name>"'],
      dpCodes: ['bright_value', 'bright_value_v2', 'brightness'], supported: false,
    },
    {
      id: 'color', featureName: 'Color Setting',
      description: 'Set light color (hue/saturation)',
      utteranceExamples: ['"set <device name> to red"', '"change <device name> color to blue"'],
      dpCodes: ['colour_data', 'colour_data_v2'], supported: false,
    },
    {
      id: 'color_temperature', featureName: 'Color Temperature',
      description: 'Set color temperature (warm/cool white)',
      utteranceExamples: ['"set <device name> to warm white"'],
      dpCodes: ['temp_value', 'temp_value_v2', 'colour_temp'], supported: false,
    },
    {
      id: 'open_close', featureName: 'OpenClose',
      description: 'Open or close device (curtain, blind)',
      utteranceExamples: ['"open <device name>"', '"close <device name>"'],
      dpCodes: ['control', 'curtain_control', 'mach_operate'], supported: false,
    },
    {
      id: 'percentage', featureName: 'Percentage',
      description: 'Set position/percentage (0-100%)',
      utteranceExamples: platform === 'alexa'
        ? ['"set the <device name> to thirty percent"', '"increase <device name> by ten percent"']
        : ['"set <device name> to 50 percent"'],
      dpCodes: ['percent_control', 'position', 'percent_state'], supported: false,
    },
    {
      id: 'temperature_setting', featureName: 'Temperature Setting',
      description: 'Set target temperature',
      utteranceExamples: ['"set <device name> to 22 degrees"'],
      dpCodes: ['temp_set', 'temperature_set', 'set_temp'], supported: false,
    },
    {
      id: 'mode_setting', featureName: 'Mode-Setting',
      description: 'Set device mode (heat, cool, auto...)',
      utteranceExamples: platform === 'alexa'
        ? ['"Alexa, set the <mode name> on the <device name> to <mode value>"']
        : ['"set <device name> to heat mode"'],
      dpCodes: ['mode', 'work_mode'], supported: false,
    },
    {
      id: 'lock_unlock', featureName: 'Lock/Unlock',
      description: 'Lock or unlock device',
      utteranceExamples: ['"lock <device name>"', '"unlock <device name>"'],
      dpCodes: ['switch_lock', 'lock', 'child_lock'], supported: false,
    },
    {
      id: 'continue_pause', featureName: 'Continue & Pause (Query not supported)',
      description: 'Pause or resume device operation',
      utteranceExamples: ['"pause device"', '"resume device"'],
      dpCodes: ['pause', 'switch_go'], supported: false,
    },
  ];
}

function evaluateFeatureSupport(features: VoiceFeature[], dataPoints: DataPoint[]): VoiceFeature[] {
  const writableCodes = new Set(
    dataPoints.filter((dp) => dp.mode !== DpMode.RO).map((dp) => dp.code)
  );
  return features.map((f) => ({
    ...f,
    supported: f.dpCodes.some((code) => writableCodes.has(code)),
  }));
}

const STEPS = ['Solution Configuration', 'Solution Release', 'Solution Activation'];

// ===================== Component =====================
export default function VoiceSolutionConfigPage() {
  const { platform } = useParams<{ platform: string }>();
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get('profileId') || '';
  const initialMode = searchParams.get('mode') || 'edit';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<DeviceProfile | null>(null);
  const [categoryCode, setCategoryCode] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);

  // Mode: 'edit' = configuring, 'released' = read-only view
  const [mode, setMode] = useState<'edit' | 'released'>(initialMode as 'edit' | 'released');
  const activeStep = mode === 'released' ? 2 : 0;

  const [addedFeatures, setAddedFeatures] = useState<VoiceFeature[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [utteranceLang, setUtteranceLang] = useState('English (US)');

  const platformName = platform === 'alexa' ? 'Alexa' : platform === 'google_assistant' ? 'Google Assistant' : platform || '';
  const categoryMap = platform === 'alexa' ? ALEXA_CATEGORIES : GOOGLE_CATEGORIES;

  const displayCategory = useMemo(() => {
    if (categoryCode && categoryMap[categoryCode]) return categoryMap[categoryCode];
    return 'Other';
  }, [categoryCode, categoryMap]);

  const allFeatures = useMemo(() => {
    const features = buildAvailableFeatures(platform || 'alexa');
    return evaluateFeatureSupport(features, dataPoints);
  }, [platform, dataPoints]);

  const recommendedFeatures = useMemo(() => {
    const addedIds = new Set(addedFeatures.map((f) => f.id));
    return allFeatures.filter((f) => f.supported && !addedIds.has(f.id));
  }, [allFeatures, addedFeatures]);

  const availableToAdd = useMemo(() => {
    const addedIds = new Set(addedFeatures.map((f) => f.id));
    return allFeatures.filter((f) => !addedIds.has(f.id));
  }, [allFeatures, addedFeatures]);

  // Mark as configuring when entering edit mode
  useEffect(() => {
    if (profileId && platform && mode === 'edit') {
      localStorage.setItem(`voice_configuring_${profileId}_${platform}`, 'true');
    }
  }, [profileId, platform, mode]);

  // Load data
  useEffect(() => {
    if (!profileId) return;
    setLoading(true);

    Promise.all([
      deviceProfileApi.getDeviceProfile(profileId),
      smartHomeProductApi.getDataPoints(profileId),
    ])
      .then(async ([prof, dps]) => {
        setProfile(prof);
        setDataPoints(dps);

        if (prof.categoryId?.id) {
          try {
            const cat = await smartHomeProductApi.getCategory(prof.categoryId.id);
            setCategoryCode(cat.code);
            setCategoryName(cat.name);
          } catch {
            setCategoryCode('');
            setCategoryName('');
          }
        }

        // Auto-add supported features
        const features = buildAvailableFeatures(platform || 'alexa');
        const evaluated = evaluateFeatureSupport(features, dps);
        setAddedFeatures(evaluated.filter((f) => f.supported));
      })
      .catch(() => {
        setProfile(null);
        setDataPoints([]);
      })
      .finally(() => setLoading(false));
  }, [profileId, platform]);

  const handleAddFeature = (feature: VoiceFeature) => {
    setAddedFeatures((prev) => [...prev, feature]);
  };

  const handleRemoveFeature = (featureId: string) => {
    setAddedFeatures((prev) => prev.filter((f) => f.id !== featureId));
  };

  /** Confirm and Test: enable voice for all devices in this profile */
  const handleConfirmAndTest = async () => {
    if (!profileId) return;
    setSaving(true);

    try {
      // Get all devices belonging to this profile
      const devicesResult = await deviceApi.getTenantDeviceInfos(
        { page: 0, pageSize: 100, sortProperty: 'name', sortOrder: 'ASC' },
        undefined,
        profileId
      );

      const deviceIds = devicesResult.data.map((d) => d.id.id);
      if (deviceIds.length === 0) {
        alert('No devices found for this product. Add devices first.');
        setSaving(false);
        return;
      }

      // Enable voice for all devices with the resolved category
      await voiceApi.configureAlexaForProfile(deviceIds, true, displayCategory);

      // Clear configuring state — now it's released
      if (platform) {
        localStorage.removeItem(`voice_configuring_${profileId}_${platform}`);
      }

      // Switch to released mode
      setMode('released');
    } catch (err) {
      console.error('Failed to confirm voice solution:', err);
      alert('Failed to enable voice features. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  /** Modify Voice Solution: switch back to edit mode */
  const handleModify = () => {
    setMode('edit');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: tuyaColors.orange }} />
      </Box>
    );
  }

  const isReadOnly = mode === 'released';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton
          onClick={() => navigate(`/voice/integration?profileId=${profileId}`)}
          size="small"
          sx={{ color: tuyaColors.textPrimary }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        {platform === 'alexa' && <img src="/alexa-icon.png" alt="Alexa" style={{ width: 24, height: 24 }} />}
        {platform === 'google_assistant' && <img src="/google-assistants-icon.png" alt="Google" style={{ width: 24, height: 24 }} />}
        <Typography variant="h5" sx={{ fontSize: '20px' }}>
          {platformName} ({profile?.name || 'Product'})
        </Typography>
      </Box>

      {/* Stepper - only show in edit mode */}
      {!isReadOnly && (
        <Paper elevation={0} sx={{ border: `1px solid ${tuyaColors.border}`, borderRadius: 1, p: 2, mb: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label, index) => (
              <Step key={label} completed={index < activeStep}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': { fontSize: '13px' },
                    '& .MuiStepIcon-root.Mui-active': { color: tuyaColors.orange },
                    '& .MuiStepIcon-root.Mui-completed': { color: tuyaColors.success },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>
      )}

      {/* Category */}
      <Paper elevation={0} sx={{ border: `1px solid ${tuyaColors.border}`, borderRadius: 1, p: 2.5, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          {isReadOnly ? (
            <CheckCircleIcon sx={{ fontSize: 20, color: tuyaColors.success }} />
          ) : (
            <CheckCircleOutlineIcon sx={{ fontSize: 20, color: tuyaColors.success }} />
          )}
          <Typography sx={{ fontWeight: 500, fontSize: '14px', color: tuyaColors.textPrimary }}>
            Category Defined in {platformName}
          </Typography>
        </Box>
        <Box sx={{ ml: 3.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontSize: '13px', color: tuyaColors.textSecondary }}>
            Category: <strong>{displayCategory}</strong>
            {categoryName && <> ({categoryName})</>}
          </Typography>
          {!isReadOnly && (
            <Button size="small" sx={{ fontSize: '11px', color: tuyaColors.info, textTransform: 'none', minWidth: 0, p: 0 }}>
              Modify
            </Button>
          )}
        </Box>
      </Paper>

      {/* Configure Voice Features */}
      <Paper elevation={0} sx={{ border: `1px solid ${tuyaColors.border}`, borderRadius: 1, p: 2.5, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {isReadOnly ? (
            <CheckCircleIcon sx={{ fontSize: 20, color: tuyaColors.success }} />
          ) : (
            <SettingsIcon sx={{ fontSize: 20, color: tuyaColors.orange }} />
          )}
          <Typography sx={{ fontWeight: 500, fontSize: '14px', color: tuyaColors.textPrimary }}>
            Configure Voice Features
          </Typography>
        </Box>

        {/* Recommended chips - only in edit mode */}
        {!isReadOnly && recommendedFeatures.length > 0 && (
          <Box sx={{ ml: 3.5, mb: 2 }}>
            <Typography sx={{ fontSize: '12px', color: tuyaColors.textSecondary, mb: 1 }}>
              Voice capabilities are auto-detected from your product's DataPoints. You can edit or add more capabilities.
            </Typography>
            <Paper
              elevation={0}
              sx={{ bgcolor: '#F8F9FA', borderRadius: 1, p: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
            >
              <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint, mr: 0.5 }}>
                {recommendedFeatures.length} recommended:
              </Typography>
              {recommendedFeatures.map((f) => (
                <Chip
                  key={f.id} label={f.featureName} size="small"
                  onClick={() => handleAddFeature(f)}
                  sx={{
                    fontSize: '11px', height: 24, bgcolor: '#fff',
                    border: `1px solid ${tuyaColors.border}`, cursor: 'pointer',
                    '&:hover': { bgcolor: '#E6F3FB', borderColor: tuyaColors.orange },
                  }}
                />
              ))}
            </Paper>
          </Box>
        )}

        {/* Feature Added header */}
        <Box sx={{ ml: 3.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: tuyaColors.textPrimary }}>
            Feature Added
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint, mr: 0.5 }}>Utterance Example</Typography>
            <Select
              size="small" value={utteranceLang}
              onChange={(e) => setUtteranceLang(e.target.value)}
              sx={{ fontSize: '11px', height: 28, minWidth: 110 }}
            >
              <MenuItem value="English (US)" sx={{ fontSize: '12px' }}>English (US)</MenuItem>
              <MenuItem value="Japanese" sx={{ fontSize: '12px' }}>Japanese</MenuItem>
              <MenuItem value="Chinese" sx={{ fontSize: '12px' }}>Chinese</MenuItem>
            </Select>
            {!isReadOnly && (
              <Button
                variant="contained" size="small"
                startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                onClick={() => setShowAddDialog(true)}
                disabled={availableToAdd.length === 0}
                sx={{ height: 28, fontSize: '11px', px: 1.5 }}
              >
                Add Feature
              </Button>
            )}
          </Box>
        </Box>

        {/* Features table */}
        <Box sx={{ ml: 3.5 }}>
          <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${tuyaColors.border}` }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '5%' }}>#</TableCell>
                  <TableCell sx={{ width: '22%' }}>Feature Name</TableCell>
                  <TableCell sx={{ width: '33%' }}>Utterance Example</TableCell>
                  <TableCell sx={{ width: '25%' }}>Supported Language</TableCell>
                  <TableCell sx={{ width: '15%', textAlign: 'right' }}>Operation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {addedFeatures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: tuyaColors.textHint }}>
                      No voice features added yet. Click recommended features above or use "Add Feature".
                    </TableCell>
                  </TableRow>
                ) : (
                  addedFeatures.map((feature, index) => (
                    <TableRow key={feature.id} hover>
                      <TableCell sx={{ color: tuyaColors.textHint }}>{index + 1}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '13px', fontWeight: 500, color: tuyaColors.textPrimary }}>
                          {feature.featureName}
                        </Typography>
                        {!feature.supported && !isReadOnly && (
                          <Chip label="Recommended" size="small"
                            sx={{ fontSize: '10px', height: 18, mt: 0.5, color: tuyaColors.warning, bgcolor: '#FFF8E6' }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '12px', color: tuyaColors.textSecondary, whiteSpace: 'normal', lineHeight: 1.6 }}>
                          {feature.utteranceExamples.map((u, i) => (
                            <span key={i}>{u}{i < feature.utteranceExamples.length - 1 && <br />}</span>
                          ))}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '11px', color: tuyaColors.textSecondary, whiteSpace: 'normal', lineHeight: 1.6 }}>
                          Spanish(MX),English(IN),Hindi(IN),Spanish(ES),French(CA),English(AU),Portuguese(BR),Italian(IT),German(GE),English(CA),English(US),Japanese(JP),French(FR),Spanish(US),English(UK)
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Tooltip title="Edit">
                          <span>
                            <IconButton size="small" disabled={isReadOnly} sx={{ color: isReadOnly ? tuyaColors.textHint : tuyaColors.info }}>
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <span>
                            <IconButton size="small" disabled={isReadOnly}
                              onClick={() => !isReadOnly && handleRemoveFeature(feature.id)}
                              sx={{ color: isReadOnly ? tuyaColors.textHint : tuyaColors.error }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>

      {/* Action button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        {isReadOnly ? (
          <Button
            variant="contained"
            onClick={handleModify}
            sx={{ px: 5, py: 1, fontSize: '14px' }}
          >
            Modify Voice Solution
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleConfirmAndTest}
            disabled={addedFeatures.length === 0 || saving}
            sx={{ px: 5, py: 1, fontSize: '14px' }}
          >
            {saving ? <CircularProgress size={20} sx={{ color: '#fff', mr: 1 }} /> : null}
            Confirm and Test
          </Button>
        )}
      </Box>

      {/* Add Feature Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '16px', fontWeight: 500 }}>Add Voice Feature</DialogTitle>
        <DialogContent>
          {availableToAdd.length === 0 ? (
            <Typography sx={{ py: 2, color: tuyaColors.textHint, textAlign: 'center' }}>
              All available features have been added.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
              {availableToAdd.map((feature) => (
                <Paper
                  key={feature.id} elevation={0}
                  sx={{
                    border: `1px solid ${tuyaColors.border}`, borderRadius: 1, p: 1.5,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#F8F9FA', borderColor: tuyaColors.orange },
                    opacity: feature.supported ? 1 : 0.6,
                  }}
                  onClick={() => { handleAddFeature(feature); setShowAddDialog(false); }}
                >
                  <Box>
                    <Typography sx={{ fontSize: '13px', fontWeight: 500, color: tuyaColors.textPrimary }}>
                      {feature.featureName}
                      {!feature.supported && (
                        <Chip label="No matching DP" size="small" sx={{ fontSize: '9px', height: 16, ml: 1, color: tuyaColors.warning }} />
                      )}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: tuyaColors.textHint, mt: 0.3 }}>
                      {feature.description}
                    </Typography>
                  </Box>
                  <AddIcon sx={{ fontSize: 18, color: tuyaColors.info }} />
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)} sx={{ color: tuyaColors.textSecondary }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
