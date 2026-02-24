import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import { Widget } from '@/models/dashboard.model';
import { useDashboardContext } from '../context/DashboardContext';
import WidgetRenderer from '../widgets/WidgetRenderer';

interface WidgetContainerProps {
  widget: Widget;
}

export default function WidgetContainer({ widget }: WidgetContainerProps) {
  const { state, dispatch } = useDashboardContext();
  const { isEdit, selectedWidgetId } = state;
  const isSelected = selectedWidgetId === widget.id;
  const [fullscreen, setFullscreen] = useState(false);

  const showTitle = widget.config?.showTitle !== false && widget.title;

  const handleSelect = (e: React.MouseEvent) => {
    if (!isEdit) return;
    e.stopPropagation();
    dispatch({ type: 'SELECT_WIDGET', widgetId: isSelected ? null : widget.id });
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'REMOVE_WIDGET', widgetId: widget.id });
  };

  const handleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'SELECT_WIDGET', widgetId: widget.id });
  };

  const widgetContent = (
    <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <WidgetRenderer widget={widget} />
    </Box>
  );

  return (
    <>
      <Paper
        elevation={isSelected ? 4 : 1}
        onClick={handleSelect}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: isSelected ? '2px solid' : '1px solid',
          borderColor: isSelected ? 'primary.main' : 'divider',
          bgcolor: widget.config?.backgroundColor || 'background.paper',
          cursor: isEdit ? 'pointer' : 'default',
          transition: 'border-color 0.2s',
        }}
      >
        {/* Title bar */}
        {(showTitle || isEdit) && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1,
            py: 0.5,
            minHeight: 32,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
          }}>
            {isEdit && (
              <Box className="widget-drag-handle" sx={{ cursor: 'grab', display: 'flex', mr: 0.5 }}>
                <DragIndicatorIcon fontSize="small" color="action" />
              </Box>
            )}
            <Typography
              variant="subtitle2"
              sx={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: widget.config?.color || 'text.primary',
              }}
            >
              {widget.title || widget.type}
            </Typography>
            {!isEdit && (
              <Tooltip title="Fullscreen">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); setFullscreen(true); }}>
                  <FullscreenIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {isEdit && (
              <Box sx={{ display: 'flex', gap: 0.25 }}>
                <Tooltip title="Widget settings">
                  <IconButton size="small" onClick={handleSettings}>
                    <SettingsIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remove widget">
                  <IconButton size="small" onClick={handleRemove} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        )}

        {/* Widget content */}
        <Box sx={{ flex: 1, overflow: 'hidden', p: widget.config?.padding || '8px' }}>
          {widgetContent}
        </Box>
      </Paper>

      {/* Fullscreen dialog */}
      <Dialog
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        maxWidth={false}
        fullWidth
        PaperProps={{ sx: { height: '90vh', maxWidth: '95vw' } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ flex: 1 }}>{widget.title || widget.type}</Typography>
          <IconButton onClick={() => setFullscreen(false)}>
            <FullscreenExitIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 2 }}>
          {widgetContent}
        </DialogContent>
      </Dialog>
    </>
  );
}
