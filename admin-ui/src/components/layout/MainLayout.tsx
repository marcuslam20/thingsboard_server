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
