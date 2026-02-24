import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useDashboardContext } from '../context/DashboardContext';
import { DashboardSettings, GridSettings, DEFAULT_GRID_SETTINGS } from '@/models/dashboard.model';

interface DashboardSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function DashboardSettingsDialog({ open, onClose }: DashboardSettingsDialogProps) {
  const { state, dispatch } = useDashboardContext();
  const config = state.dashboard?.configuration;

  const [title, setTitle] = useState('');
  const [showTitle, setShowTitle] = useState(true);
  const [hideToolbar, setHideToolbar] = useState(false);
  const [toolbarAlwaysOpen, setToolbarAlwaysOpen] = useState(false);
  const [dashboardCss, setDashboardCss] = useState('');
  const [columns, setColumns] = useState(24);
  const [margin, setMargin] = useState(10);
  const [rowHeight, setRowHeight] = useState(50);
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');

  useEffect(() => {
    if (open && state.dashboard) {
      const settings = config?.settings || {};
      const gridSettings = config?.states?.default?.layouts?.main?.gridSettings || DEFAULT_GRID_SETTINGS;

      setTitle(state.dashboard.title || '');
      setShowTitle(settings.showTitle !== false);
      setHideToolbar(settings.hideToolbar || false);
      setToolbarAlwaysOpen(settings.toolbarAlwaysOpen || false);
      setDashboardCss(settings.dashboardCss || '');
      setColumns(gridSettings.columns || 24);
      setMargin(gridSettings.margin || 10);
      setRowHeight(gridSettings.rowHeight || 50);
      setBackgroundColor(gridSettings.backgroundColor || '#FFFFFF');
    }
  }, [open, state.dashboard, config]);

  const handleSave = () => {
    if (!state.dashboard) return;

    const settings: DashboardSettings = {
      showTitle,
      hideToolbar,
      toolbarAlwaysOpen,
      dashboardCss,
    };

    const gridSettings: GridSettings = {
      columns,
      margin,
      rowHeight,
      backgroundColor,
    };

    const states = { ...(config?.states || {}) };
    const defaultState = states.default || { name: 'default', root: true, layouts: { main: {} } };
    states.default = {
      ...defaultState,
      layouts: {
        ...defaultState.layouts,
        main: {
          ...defaultState.layouts.main,
          gridSettings,
        },
      },
    };

    dispatch({
      type: 'UPDATE_SETTINGS',
      settings: { settings, states },
    });

    // Update title on dashboard directly
    if (title !== state.dashboard.title) {
      const updatedDashboard = { ...state.dashboard, title };
      dispatch({ type: 'SET_DASHBOARD', dashboard: updatedDashboard });
    }

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Dashboard Settings</DialogTitle>
      <DialogContent>
        <TextField
          label="Dashboard Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          margin="normal"
          size="small"
        />

        <FormControlLabel
          control={<Checkbox checked={showTitle} onChange={(e) => setShowTitle(e.target.checked)} size="small" />}
          label="Show title"
        />

        <FormControlLabel
          control={<Checkbox checked={hideToolbar} onChange={(e) => setHideToolbar(e.target.checked)} size="small" />}
          label="Hide toolbar"
        />

        <FormControlLabel
          control={<Checkbox checked={toolbarAlwaysOpen} onChange={(e) => setToolbarAlwaysOpen(e.target.checked)} size="small" />}
          label="Keep toolbar always open"
        />

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Grid Settings
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Columns"
            type="number"
            value={columns}
            onChange={(e) => setColumns(Number(e.target.value))}
            size="small"
            sx={{ flex: 1 }}
          />
          <TextField
            label="Margin (px)"
            type="number"
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
            size="small"
            sx={{ flex: 1 }}
          />
          <TextField
            label="Row Height (px)"
            type="number"
            value={rowHeight}
            onChange={(e) => setRowHeight(Number(e.target.value))}
            size="small"
            sx={{ flex: 1 }}
          />
        </Box>

        <TextField
          label="Background Color"
          value={backgroundColor}
          onChange={(e) => setBackgroundColor(e.target.value)}
          fullWidth
          margin="normal"
          size="small"
          placeholder="#FFFFFF"
        />

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Custom CSS
        </Typography>

        <TextField
          value={dashboardCss}
          onChange={(e) => setDashboardCss(e.target.value)}
          fullWidth
          multiline
          rows={4}
          size="small"
          placeholder=".dashboard-grid { /* custom styles */ }"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Apply</Button>
      </DialogActions>
    </Dialog>
  );
}
