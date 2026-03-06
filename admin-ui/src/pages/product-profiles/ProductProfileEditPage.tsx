import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Autocomplete from '@mui/material/Autocomplete';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Link from '@mui/material/Link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CircularProgress from '@mui/material/CircularProgress';
import { DeviceProfile } from '@/models/device.model';
import { ProductCategory } from '@/models/datapoint.model';
import { deviceProfileApi } from '@/api/device-profile.api';
import { smartHomeProductApi } from '@/api/smarthome-product.api';
import api from '@/api/client';
import { tuyaColors } from '@/theme/theme';

interface FormData {
  name: string;
  description: string;
  status: 'draft' | 'online';
  brand: string;
  categoryId: string;
}

function resolveImageUrl(image: string | undefined | null): string | null {
  if (!image) return null;
  if (image.startsWith('data:')) return image;
  if (image.startsWith('tb-image;')) return image.substring('tb-image;'.length);
  if (image.startsWith('tb-image:')) {
    const ref = image.substring('tb-image:'.length);
    return `/api/images/${ref}`;
  }
  return image;
}

const LABEL_WIDTH = 160;

const ROW_SX = {
  display: 'flex',
  alignItems: 'flex-start',
  mb: 3,
  gap: 2,
};

const LABEL_SX = {
  fontSize: '14px',
  color: tuyaColors.textSecondary,
  fontWeight: 400,
  lineHeight: '40px',
  width: LABEL_WIDTH,
  minWidth: LABEL_WIDTH,
  flexShrink: 0,
  textAlign: 'right' as const,
};

const LABEL_TOP_SX = {
  ...LABEL_SX,
  lineHeight: '22px',
  pt: 1,
};

export default function ProductProfileEditPage() {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const [profile, setProfile] = useState<DeviceProfile | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [categoryInputValue, setCategoryInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { name: '', description: '', status: 'draft', brand: '', categoryId: '' },
  });

  // Load profile + categories
  useEffect(() => {
    if (!profileId) return;
    setLoading(true);

    Promise.all([
      deviceProfileApi.getDeviceProfile(profileId),
      smartHomeProductApi.getCategories(0, 100),
    ])
      .then(([p, catResult]) => {
        setProfile(p);
        setCategories(catResult.data);

        // Find the matching category
        const matchedCat = p.categoryId?.id
          ? catResult.data.find((c) => c.id.id === p.categoryId?.id) || null
          : null;
        setSelectedCategory(matchedCat);
        setCategoryInputValue(matchedCat?.name || '');

        reset({
          name: p.name || '',
          description: p.description || '',
          status: p.default ? 'online' : 'draft',
          brand: '',
          categoryId: matchedCat?.id.id || '',
        });

        // Load image
        const imageUrl = resolveImageUrl(p.image);
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
      })
      .catch((err) => {
        console.error('Failed to load profile:', err);
        setError('Failed to load product profile');
      })
      .finally(() => setLoading(false));
  }, [profileId, reset]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      setError('Image size must be less than 500 KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setImageBase64(base64);
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
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        ...profile,
        name: data.name,
        description: data.description || undefined,
        default: data.status === 'online',
      };

      // Category — resolve or create
      const trimmedInput = categoryInputValue.trim();
      if (selectedCategory) {
        // User picked an existing category from the list
        payload.categoryId = { id: selectedCategory.id.id, entityType: 'PRODUCT_CATEGORY' };
      } else if (trimmedInput) {
        // User typed a new name — check if it already exists (case-insensitive)
        const existing = categories.find(
          (c) => c.name.toLowerCase() === trimmedInput.toLowerCase(),
        );
        if (existing) {
          payload.categoryId = { id: existing.id.id, entityType: 'PRODUCT_CATEGORY' };
        } else {
          // Create new category
          const newCat = await smartHomeProductApi.saveCategory({
            name: trimmedInput,
            code: trimmedInput.toLowerCase().replace(/\s+/g, '_'),
            sortOrder: 0,
          } as Partial<ProductCategory>);
          payload.categoryId = { id: newCat.id.id, entityType: 'PRODUCT_CATEGORY' };
        }
      } else {
        payload.categoryId = null;
      }

      if (imageChanged) {
        payload.image = imageBase64 || null;
      }

      await deviceProfileApi.saveDeviceProfile(payload as Partial<DeviceProfile>);
      navigate('/operation/productFiles');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save product profile');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/operation/productFiles');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: tuyaColors.orange }} />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="error">Product profile not found</Typography>
        <Button onClick={handleBack} sx={{ mt: 2 }}>Back to list</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 100px)' }}>
      {saving && <LinearProgress sx={{ position: 'fixed', top: 44, left: 0, right: 0, zIndex: 1300 }} />}

      {/* Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 3,
        pb: 2,
        borderBottom: `1px solid ${tuyaColors.border}`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handleBack} size="small" sx={{ color: tuyaColors.info }}>
            <ArrowBackIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Typography sx={{ fontSize: '16px', fontWeight: 500, color: tuyaColors.textPrimary }}>
            Edit Product Profile
          </Typography>
        </Box>
        <IconButton onClick={handleBack} size="small" sx={{ color: tuyaColors.textHint }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* Form Body */}
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}
      >
        <Box sx={{ flex: 1, maxWidth: 800, mx: 'auto', width: '100%', px: 2 }}>
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
                    sx={{ '& .MuiInputBase-root': { height: 40 } }}
                  />
                )}
              />
              <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint, mt: 0.5 }}>
                Original ID: {profile.id.id.substring(0, 16)} | Original Name: {profile.name}
              </Typography>
            </Box>
          </Box>

          {/* Product Description */}
          <Box sx={{ ...ROW_SX, alignItems: 'flex-start' }}>
            <Typography sx={LABEL_TOP_SX}>Product Description:</Typography>
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
                    placeholder="Provide the basic information about your product"
                    sx={{ '& .MuiInputBase-root': { height: 'auto' } }}
                  />
                )}
              />
            </Box>
          </Box>

          {/* Product Image */}
          <Box sx={{ ...ROW_SX, alignItems: 'flex-start' }}>
            <Typography sx={LABEL_TOP_SX}>
              <Box component="span" sx={{ color: tuyaColors.error }}>*</Box>
              {' '}Product Image:
            </Typography>
            <Box sx={{ flex: 1 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif"
                hidden
                onChange={handleImageUpload}
              />
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                {imagePreview ? (
                  <Box sx={{
                    width: 80, height: 80, borderRadius: 1,
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
                        width: 20, height: 20,
                      }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                  </Box>
                ) : (
                  <Box
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      width: 80, height: 80, borderRadius: 1,
                      border: `1px dashed #d9d9d9`,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0,
                      bgcolor: '#fafafa',
                      '&:hover': { borderColor: tuyaColors.info, bgcolor: 'rgba(0,139,213,0.04)' },
                    }}
                  >
                    <CloudUploadOutlinedIcon sx={{ fontSize: 22, color: tuyaColors.textHint, mb: 0.25 }} />
                    <Typography sx={{ fontSize: '11px', color: tuyaColors.textHint }}>Upload</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      height: 32, fontSize: '13px', px: 2,
                      color: tuyaColors.textPrimary, borderColor: tuyaColors.border,
                      textTransform: 'none',
                    }}
                  >
                    Upload
                  </Button>
                  <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint }}>
                    A file in JPG, JPEG, GIF, or PNG format, no more than 500 KB.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Product Category */}
          <Box sx={ROW_SX}>
            <Typography sx={LABEL_SX}>Product category:</Typography>
            <Box sx={{ flex: 1 }}>
              <Autocomplete
                freeSolo
                options={categories}
                value={selectedCategory}
                inputValue={categoryInputValue}
                onInputChange={(_, newInputValue) => setCategoryInputValue(newInputValue)}
                onChange={(_, newValue) => {
                  if (typeof newValue === 'string') {
                    // User pressed Enter with free text — keep as input, no selection
                    setSelectedCategory(null);
                    setCategoryInputValue(newValue);
                  } else {
                    // User picked from dropdown
                    setSelectedCategory(newValue);
                    setCategoryInputValue(newValue?.name || '');
                  }
                }}
                getOptionLabel={(option) =>
                  typeof option === 'string' ? option : option.name
                }
                isOptionEqualToValue={(option, value) => option.id.id === value.id.id}
                renderOption={(props, option) => (
                  <li {...props} key={option.id.id}>
                    <Box>
                      <Typography sx={{ fontSize: '14px' }}>{option.name}</Typography>
                      <Typography sx={{ fontSize: '11px', color: tuyaColors.textHint }}>
                        {option.code}
                      </Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Type to search or create category"
                    size="small"
                    sx={{ '& .MuiInputBase-root': { height: 40 } }}
                  />
                )}
                noOptionsText={
                  categoryInputValue.trim()
                    ? `Press Save to create "${categoryInputValue.trim()}"`
                    : 'Type a category name'
                }
              />
              <Typography sx={{ fontSize: '12px', color: tuyaColors.textHint, mt: 0.5 }}>
                Product creation category: {selectedCategory?.name || categoryInputValue.trim() || '-'}
              </Typography>
            </Box>
          </Box>

          {/* User Manual (placeholder) */}
          <Box sx={ROW_SX}>
            <Typography sx={LABEL_SX}>
              <Box component="span" sx={{ color: tuyaColors.error }}>*</Box>
              {' '}User Manual:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, lineHeight: '40px' }}>
              <Typography sx={{ fontSize: '14px', color: tuyaColors.textPrimary }}>
                No user manual found
              </Typography>
              <Link
                href="#"
                onClick={(e: React.MouseEvent) => e.preventDefault()}
                sx={{ fontSize: '14px', color: tuyaColors.info, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Manage User Manual
              </Link>
            </Box>
          </Box>

          {/* Product Knowledge Base (placeholder) */}
          <Box sx={ROW_SX}>
            <Typography sx={LABEL_SX}>Product Knowledge Base:</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', minHeight: 40 }}>
              <Chip label="Tuya General Knowledge: 0" size="small" variant="outlined" sx={{ height: 28, fontSize: '12px', borderColor: tuyaColors.border }} />
              <Chip label="General knowledge under account: 0" size="small" variant="outlined" sx={{ height: 28, fontSize: '12px', borderColor: tuyaColors.border }} />
              <Chip label="Product Custom Knowledge: 0" size="small" variant="outlined" sx={{ height: 28, fontSize: '12px', borderColor: tuyaColors.border }} />
              <Link
                href="#"
                onClick={(e: React.MouseEvent) => e.preventDefault()}
                sx={{ fontSize: '14px', color: tuyaColors.info, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Manage Knowledge Base
              </Link>
            </Box>
          </Box>

          {/* Brand (placeholder dropdown) */}
          <Box sx={ROW_SX}>
            <Typography sx={LABEL_SX}>
              <Box component="span" sx={{ color: tuyaColors.error }}>*</Box>
              {' '}Brand:
            </Typography>
            <Box sx={{ flex: 1 }}>
              <Controller
                name="brand"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    fullWidth
                    size="small"
                    displayEmpty
                    sx={{ height: 40 }}
                  >
                    <MenuItem value="">
                      <Typography sx={{ color: tuyaColors.textHint }}>Select</Typography>
                    </MenuItem>
                  </Select>
                )}
              />
            </Box>
          </Box>

          {/* Status */}
          <Box sx={ROW_SX}>
            <Typography sx={LABEL_SX}>Status:</Typography>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <RadioGroup row {...field}>
                  <FormControlLabel
                    value="draft"
                    control={<Radio size="small" />}
                    label={<Typography sx={{ fontSize: '14px' }}>Draft</Typography>}
                  />
                  <FormControlLabel
                    value="online"
                    control={<Radio size="small" />}
                    label={<Typography sx={{ fontSize: '14px' }}>Online</Typography>}
                    sx={{ ml: 2 }}
                  />
                </RadioGroup>
              )}
            />
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{
          display: 'flex', justifyContent: 'center', gap: 2,
          py: 2, mt: 2,
          borderTop: `1px solid ${tuyaColors.border}`,
        }}>
          <Button
            onClick={handleBack}
            variant="outlined"
            sx={{
              height: 36, px: 4, fontSize: '14px',
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
            disabled={saving}
            sx={{ height: 36, px: 4, fontSize: '14px' }}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

