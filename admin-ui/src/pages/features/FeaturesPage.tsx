import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

export default function FeaturesPage() {
  const { t } = useTranslation();
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
        {t('admin.settings')}
      </Typography>
      <Typography color="text.secondary">
        This page is under construction.
      </Typography>
    </Box>
  );
}
