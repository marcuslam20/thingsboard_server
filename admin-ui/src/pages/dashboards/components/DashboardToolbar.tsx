import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import UndoIcon from '@mui/icons-material/Undo';
import { useDashboardContext } from '../context/DashboardContext';
import DashboardSettingsDialog from './DashboardSettingsDialog';

interface DashboardToolbarProps {
  onAddWidget: () => void;
}

export default function DashboardToolbar({ onAddWidget }: DashboardToolbarProps) {
  const navigate = useNavigate();
  const { state, dispatch, saveDashboard } = useDashboardContext();
  const { dashboard, isEdit, isDirty, saving } = state;
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSave = async () => {
    await saveDashboard();
    dispatch({ type: 'TOGGLE_EDIT' });
  };

  const handleCancel = () => {
    dispatch({ type: 'REVERT' });
    dispatch({ type: 'TOGGLE_EDIT' });
  };

  return (
    <>
      <Toolbar
        sx={{
          px: 2,
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: isEdit ? 'action.hover' : 'background.paper',
          minHeight: '48px !important',
        }}
      >
        <Tooltip title="Back to dashboards">
          <IconButton onClick={() => navigate('/dashboards')} size="small">
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>

        <Typography variant="h6" sx={{ flex: 1, fontSize: '1.1rem' }}>
          {dashboard?.title || 'Dashboard'}
        </Typography>

        {isEdit ? (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={onAddWidget}
            >
              Add Widget
            </Button>

            <Tooltip title="Dashboard settings">
              <IconButton size="small" onClick={() => setSettingsOpen(true)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            {isDirty && (
              <Tooltip title="Revert changes">
                <IconButton size="small" onClick={() => dispatch({ type: 'REVERT' })}>
                  <UndoIcon />
                </IconButton>
              </Tooltip>
            )}

            <Button
              variant="contained"
              size="small"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving || !isDirty}
            >
              Save
            </Button>

            <Tooltip title="Cancel editing">
              <IconButton size="small" onClick={handleCancel}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Tooltip title="Edit dashboard">
            <IconButton onClick={() => dispatch({ type: 'TOGGLE_EDIT' })}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>

      <DashboardSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
