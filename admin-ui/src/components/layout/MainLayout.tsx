import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Sidebar, { SIDEBAR_WIDTH } from './Sidebar';
import TopBar from './TopBar';
import { tuyaColors } from '@/theme/theme';

export default function MainLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: tuyaColors.bodyBg }}>
      {/* Sidebar - fixed left */}
      <Sidebar />

      {/* Main content area */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: `${SIDEBAR_WIDTH}px`,
          transition: 'margin-left 200ms ease',
          minHeight: '100vh',
        }}
      >
        {/* Top bar */}
        <TopBar />

        {/* Page content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            px: 5,
            py: 2.5,
            width: '100%',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
