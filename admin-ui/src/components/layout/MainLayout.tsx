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
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Sidebar, { SIDEBAR_WIDTH } from './Sidebar';
import TopBar from './TopBar';
import { tuyaColors } from '@/theme/theme';

export default function MainLayout() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tuyaColors.bodyBg }}>
      {/* Top bar — full width, fixed at top */}
      <TopBar />

      {/* Sidebar — fixed left, below TopBar */}
      <Sidebar />

      {/* Page content — offset by sidebar */}
      <Box
        component="main"
        sx={{
          ml: `${SIDEBAR_WIDTH}px`,
          pt: 'calc(44px + 20px)',
          pb: 2.5,
          px: 5,
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
