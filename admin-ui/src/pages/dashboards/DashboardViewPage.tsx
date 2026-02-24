import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { DashboardProvider, useDashboardContext } from './context/DashboardContext';
import DashboardToolbar from './components/DashboardToolbar';
import DashboardGrid from './components/DashboardGrid';
import AddWidgetDialog from './components/AddWidgetDialog';
import WidgetConfigPanel from './components/WidgetConfigPanel';

function DashboardViewContent() {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const { state, loadDashboard } = useDashboardContext();
  const { loading, isEdit, selectedWidgetId, dashboard } = state;
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);

  useEffect(() => {
    if (dashboardId) {
      loadDashboard(dashboardId);
    }
  }, [dashboardId, loadDashboard]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!dashboard) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 400 }}>
        <Typography color="text.secondary">Dashboard not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <DashboardToolbar onAddWidget={() => setAddWidgetOpen(true)} />

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <DashboardGrid />
        </Box>

        {isEdit && selectedWidgetId && (
          <WidgetConfigPanel />
        )}
      </Box>

      <AddWidgetDialog
        open={addWidgetOpen}
        onClose={() => setAddWidgetOpen(false)}
      />
    </Box>
  );
}

export default function DashboardViewPage() {
  return (
    <DashboardProvider>
      <DashboardViewContent />
    </DashboardProvider>
  );
}
