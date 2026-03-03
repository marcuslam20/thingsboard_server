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
