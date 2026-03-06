import { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { DeviceProfile } from '@/models/device.model';
import { ProductCategory } from '@/models/datapoint.model';
import { deviceProfileApi } from '@/api/device-profile.api';
import api from '@/api/client';
import { tuyaColors } from '@/theme/theme';

interface FormData {
  name: string;
  productModel: string;
  description: string;
}

interface Props {
  open: boolean;
  profile: DeviceProfile | null;
  category: ProductCategory | null;
  onClose: () => void;
  onSaved: (updated: DeviceProfile) => void;
}

/**
 * Convert TB image reference to a displayable URL.
 * TB stores images as "tb-image;/api/images/tenant/KEY" references (note: semicolon, not colon).
 * Extract the URL path after the semicolon to display.
 * Base64 data URLs are passed through as-is.
 */
function resolveImageUrl(image: string | undefined | null): string | null {
  if (!image) return null;
  if (image.startsWith('data:')) return image; // base64 — already displayable
  if (image.startsWith('tb-image;')) {
    // Format: "tb-image;/api/images/tenant/KEY" — extract the URL path
    return image.substring('tb-image;'.length);
  }
  if (image.startsWith('tb-image:')) {
    // Legacy/alternative format: "tb-image:tenant/KEY"
    const ref = image.substring('tb-image:'.length);
    return `/api/images/${ref}`;
  }
  return image; // regular URL
}

function getProtocolLabels(profile: DeviceProfile): string[] {
  if (profile.connectivityType) {
    switch (profile.connectivityType) {
      case 'WIFI': return ['Wi-Fi'];
      case 'BLUETOOTH_LE': return ['Bluetooth LE'];
      case 'ZIGBEE': return ['Zigbee 3.0'];
      case 'WIFI_BLUETOOTH': return ['Wi-Fi', 'Bluetooth LE'];
      default: return [profile.connectivityType];
    }
  }
  switch (profile.transportType) {
    case 'MQTT': return ['Wi-Fi', 'Bluetooth LE'];
    case 'COAP': return ['Bluetooth LE'];
    case 'LWM2M': return ['Zigbee 3.0'];
    default: return [profile.transportType || 'DEFAULT'];
  }
}

// Right-aligned labels so all ':' line up vertically
const LABEL_WIDTH = 120;

const ROW_SX = {
  display: 'flex',
  alignItems: 'flex-start',
  mb: 2.5,
  gap: 2,
};

const LABEL_SX = {
  fontSize: '13px',
  color: tuyaColors.textSecondary,
  fontWeight: 400,
  lineHeight: '36px',
  width: LABEL_WIDTH,
  minWidth: LABEL_WIDTH,
  flexShrink: 0,
  textAlign: 'right' as const,
};

const LABEL_TOP_SX = {
  ...LABEL_SX,
  lineHeight: '22px',
  pt: 0.5,
};

export default function InformationManagementDrawer({ open, profile, category, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { name: '', productModel: '', description: '' },
  });

  useEffect(() => {
    if (open && profile) {
      reset({
        name: profile.name || '',
        productModel: profile.productModel || '',
        description: profile.description || '',
      });
      setImageBase64(null);
      setImageChanged(false);
      setError('');

      // Fetch image via Axios (with JWT auth) then create blob URL for display
      const imageUrl = resolveImageUrl(profile.image);
      if (imageUrl && !imageUrl.startsWith('data:')) {
        api.get(imageUrl, { responseType: 'blob' })
          .then((res) => {
            const blobUrl = URL.createObjectURL(res.data);
            setImagePreview(blobUrl);
          })
          .catch(() => setImagePreview(null));
      } else {
        setImagePreview(imageUrl);
      }
    }
    // Cleanup blob URLs on unmount/re-run
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profile, reset]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setError('Image size must be less than 1MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setImageBase64(base64); // Store base64 data URL to send to backend
      setImageChanged(true);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setImageChanged(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: FormData) => {
    if (!profile) return;
    setLoading(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        ...profile,
        name: data.name,
        productModel: data.productModel || undefined,
        description: data.description || undefined,
      };

      if (imageChanged) {
        // Send base64 data URL directly — backend's replaceBase64WithImageUrl()
        // will auto-create a TbResource and replace with tb-image: reference
        payload.image = imageBase64 || null;
      }
      // else: keep profile.image as-is (existing tb-image: reference)

      console.log('[InformationManagement] Saving profile, imageChanged:', imageChanged,
        'image type:', payload.image ? (typeof payload.image === 'string' ? payload.image.substring(0, 50) + '...' : 'null') : 'null');

      const updated = await deviceProfileApi.saveDeviceProfile(payload as Partial<DeviceProfile>);
      console.log('[InformationManagement] Save success, returned image:', updated.image?.substring(0, 80));
      onSaved(updated);
    } catch (err: unknown) {
      console.error('[InformationManagement] Save failed:', err);
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save product information');
    } finally {
      setLoading(false);
    }
  };

  const categoryName = category?.name || profile?.type || '';
  const protocolLabels = profile ? getProtocolLabels(profile) : [];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ zIndex: 1400 }}
      PaperProps={{
        sx: {
          width: '50vw',
          minWidth: 620,
          maxWidth: 800,
          boxShadow: '-4px 0 16px rgba(0,0,0,0.08)',
        },
      }}
    >
      {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} />}

      {/* ===== Header: Title + X close ===== */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        py: 2,
        minHeight: 56,
        borderBottom: `1px solid ${tuyaColors.border}`,
      }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 500, color: tuyaColors.textPrimary }}>
          Information Management
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            width: 32,
            height: 32,
            color: tuyaColors.textHint,
            '&:hover': { color: tuyaColors.textPrimary, bgcolor: '#f5f5f5' },
          }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* ===== Form body ===== */}
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'auto', pl: 4, pr: 5, py: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2, fontSize: '13px' }}>{error}</Alert>}

          {/* Product Name */}
          <Box sx={ROW_SX}>
            <Typography sx={LABEL_SX}>
              <Box component="span" sx={{ color: tuyaColors.error }}>*</Box>
              {' '}Product Name:
            </Typography>
            <Box sx={{ flex: 1 }}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Product name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    placeholder="Enter product name"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    sx={{ '& .MuiInputBase-root': { height: 36 } }}
                  />
                )}
              />
              <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint, mt: 0.5 }}>
                To edit the device name displayed in the app, go Product Configuration &gt; Multilingual
              </Typography>
            </Box>
          </Box>

          {/* Product Image */}
          <Box sx={ROW_SX}>
            <Typography sx={LABEL_TOP_SX}>
              <Box component="span" sx={{ color: tuyaColors.error }}>*</Box>
              {' '}Product Image:
            </Typography>
            <Box sx={{ flex: 1 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                hidden
                onChange={handleImageUpload}
              />
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                {imagePreview ? (
                  <Box sx={{
                    width: 100, height: 100, borderRadius: 1,
                    border: `1px solid ${tuyaColors.border}`,
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}>
                    <Box
                      component="img"
                      src={imagePreview}
                      alt="Product"
                      sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    <IconButton
                      size="small"
                      onClick={handleRemoveImage}
                      sx={{
                        position: 'absolute', top: 2, right: 2,
                        bgcolor: 'rgba(0,0,0,0.5)', color: '#fff',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                        width: 22, height: 22,
                      }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Box>
                ) : (
                  <Box
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      width: 100, height: 100, borderRadius: 1,
                      border: `1px dashed #d9d9d9`,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0,
                      bgcolor: '#fafafa',
                      '&:hover': { borderColor: tuyaColors.info, bgcolor: 'rgba(0,139,213,0.04)' },
                    }}
                  >
                    <CloudUploadOutlinedIcon sx={{ fontSize: 24, color: tuyaColors.textHint, mb: 0.5 }} />
                    <Typography sx={{ fontSize: '11px', color: tuyaColors.textHint }}>Upload</Typography>
                  </Box>
                )}
                <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint, lineHeight: 1.6 }}>
                  Product Icons maintain
                  <br /><br />
                  Dimension: 404*404px, Up to 6 uploads are supported.
                  <br />
                  Note: A change in the image takes effect in the app in 15 minutes. For a paired device, the change takes effect only after it&apos;s paired again.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Product Type (readonly) */}
          <Box sx={ROW_SX}>
            <Typography sx={LABEL_SX}>Product Type:</Typography>
            <Typography sx={{ fontSize: '14px', color: tuyaColors.textPrimary, lineHeight: '36px' }}>
              {categoryName || '—'}
            </Typography>
          </Box>

          {/* Protocol Type (readonly chips) */}
          <Box sx={ROW_SX}>
            <Typography sx={LABEL_SX}>Protocol Type:</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', minHeight: 36 }}>
              {protocolLabels.map((label) => (
                <Chip
                  key={label}
                  label={label}
                  size="small"
                  sx={{
                    height: 24, fontSize: '12px',
                    bgcolor: 'rgba(0,139,213,0.08)',
                    color: tuyaColors.info,
                    borderRadius: '12px',
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Product Model */}
          <Box sx={ROW_SX}>
            <Typography sx={LABEL_SX}>Product Model:</Typography>
            <Box sx={{ flex: 1 }}>
              <Controller
                name="productModel"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    placeholder="Enter your product model, supported by product category"
                    sx={{ '& .MuiInputBase-root': { height: 36 } }}
                  />
                )}
              />
            </Box>
          </Box>

          {/* Power (W) */}
          <Box sx={ROW_SX}>
            <Typography sx={LABEL_SX}>Power (W):</Typography>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Fill in the number(s) and unit(s), e.g. 200W"
                sx={{ '& .MuiInputBase-root': { height: 36 } }}
              />
            </Box>
          </Box>

          {/* Remarks */}
          <Box sx={{ ...ROW_SX, alignItems: 'flex-start' }}>
            <Typography sx={LABEL_TOP_SX}>Remarks:</Typography>
            <Box sx={{ flex: 1 }}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="E.g. product features, sales territory, sales channels, and model numbers"
                    sx={{ '& .MuiInputBase-root': { height: 'auto' } }}
                  />
                )}
              />
            </Box>
          </Box>
        </Box>

        {/* ===== Footer: Cancel + Save ===== */}
        <Box sx={{
          display: 'flex', justifyContent: 'flex-end', gap: 1.5,
          px: 4, py: 2,
          borderTop: `1px solid ${tuyaColors.border}`,
        }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              height: 36, px: 3, fontSize: '13px',
              color: tuyaColors.textSecondary,
              borderColor: tuyaColors.border,
              '&:hover': { borderColor: tuyaColors.textHint, bgcolor: '#fafafa' },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ height: 36, px: 3, fontSize: '13px' }}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
