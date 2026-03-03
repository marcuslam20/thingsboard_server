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
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

export default function VcPage() {
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
