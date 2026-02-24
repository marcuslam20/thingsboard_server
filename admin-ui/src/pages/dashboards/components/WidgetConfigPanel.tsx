import { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import { useDashboardContext } from '../context/DashboardContext';
import { Datasource, Widget } from '@/models/dashboard.model';
import DatasourceEditor from './DatasourceEditor';

export default function WidgetConfigPanel() {
  const { state, dispatch } = useDashboardContext();
  const { dashboard, selectedWidgetId } = state;

  const widget: Widget | null = useMemo(() => {
    if (!dashboard?.configuration?.widgets || !selectedWidgetId) return null;
    return dashboard.configuration.widgets[selectedWidgetId] || null;
  }, [dashboard, selectedWidgetId]);

  const [title, setTitle] = useState('');
  const [showTitle, setShowTitle] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('');

  useEffect(() => {
    if (widget) {
      setTitle(widget.title || '');
      setShowTitle(widget.config?.showTitle !== false);
      setBackgroundColor(widget.config?.backgroundColor || '');
    }
  }, [widget]);

  if (!widget) return null;

  const handleTitleBlur = () => {
    if (title !== widget.title) {
      dispatch({ type: 'UPDATE_WIDGET_TITLE', widgetId: widget.id, title });
    }
  };

  const handleShowTitleChange = (checked: boolean) => {
    setShowTitle(checked);
    dispatch({ type: 'UPDATE_WIDGET', widgetId: widget.id, config: { showTitle: checked } });
  };

  const handleBackgroundChange = (color: string) => {
    setBackgroundColor(color);
    dispatch({ type: 'UPDATE_WIDGET', widgetId: widget.id, config: { backgroundColor: color } });
  };

  const handleDatasourceChange = (ds: Datasource) => {
    dispatch({
      type: 'UPDATE_WIDGET',
      widgetId: widget.id,
      config: { datasources: [ds] },
    });
  };

  const currentDatasource: Datasource = widget.config?.datasources?.[0] || {
    type: 'device',
    dataKeys: [],
  };

  // Widget-type-specific settings
  const renderTypeSettings = () => {
    const settings = widget.config?.settings || {};
    const widgetType = (settings.widgetType as string) || '';

    switch (widgetType) {
      case 'value_card':
      case 'gauge':
        return (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Value Settings
            </Typography>
            <TextField
              size="small"
              label="Units"
              value={(settings.units as string) || ''}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_WIDGET',
                  widgetId: widget.id,
                  config: { settings: { ...settings, units: e.target.value } },
                })
              }
              fullWidth
              sx={{ mb: 1 }}
            />
            {widgetType === 'gauge' && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  label="Min"
                  type="number"
                  value={(settings.minValue as number) ?? 0}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_WIDGET',
                      widgetId: widget.id,
                      config: { settings: { ...settings, minValue: Number(e.target.value) } },
                    })
                  }
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label="Max"
                  type="number"
                  value={(settings.maxValue as number) ?? 100}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_WIDGET',
                      widgetId: widget.id,
                      config: { settings: { ...settings, maxValue: Number(e.target.value) } },
                    })
                  }
                  sx={{ flex: 1 }}
                />
              </Box>
            )}
          </>
        );

      case 'label':
        return (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Label Settings
            </Typography>
            <TextField
              size="small"
              label="Label Text"
              value={(settings.labelText as string) || ''}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_WIDGET',
                  widgetId: widget.id,
                  config: { settings: { ...settings, labelText: e.target.value } },
                })
              }
              fullWidth
              multiline
              rows={3}
              sx={{ mb: 1 }}
            />
            <TextField
              size="small"
              label="Font Size"
              type="number"
              value={(settings.fontSize as number) || 16}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_WIDGET',
                  widgetId: widget.id,
                  config: { settings: { ...settings, fontSize: Number(e.target.value) } },
                })
              }
              fullWidth
            />
          </>
        );

      case 'rpc_button':
        return (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              RPC Settings
            </Typography>
            <TextField
              size="small"
              label="Button Label"
              value={(settings.buttonLabel as string) || 'Execute'}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_WIDGET',
                  widgetId: widget.id,
                  config: { settings: { ...settings, buttonLabel: e.target.value } },
                })
              }
              fullWidth
              sx={{ mb: 1 }}
            />
            <TextField
              size="small"
              label="RPC Method"
              value={(settings.rpcMethod as string) || 'setValue'}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_WIDGET',
                  widgetId: widget.id,
                  config: { settings: { ...settings, rpcMethod: e.target.value } },
                })
              }
              fullWidth
              sx={{ mb: 1 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={(settings.twoWayRpc as boolean) || false}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_WIDGET',
                      widgetId: widget.id,
                      config: { settings: { ...settings, twoWayRpc: e.target.checked } },
                    })
                  }
                  size="small"
                />
              }
              label="Two-way RPC"
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{
      width: 320,
      borderLeft: '1px solid',
      borderColor: 'divider',
      overflow: 'auto',
      p: 2,
      bgcolor: 'background.paper',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 600 }}>
          Widget Settings
        </Typography>
        <IconButton size="small" onClick={() => dispatch({ type: 'SELECT_WIDGET', widgetId: null })}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Common settings */}
      <TextField
        size="small"
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        fullWidth
        sx={{ mb: 1 }}
      />

      <FormControlLabel
        control={<Checkbox checked={showTitle} onChange={(e) => handleShowTitleChange(e.target.checked)} size="small" />}
        label="Show title"
      />

      <TextField
        size="small"
        label="Background Color"
        value={backgroundColor}
        onChange={(e) => handleBackgroundChange(e.target.value)}
        fullWidth
        sx={{ mb: 1 }}
        placeholder="#FFFFFF"
      />

      <Divider sx={{ my: 1 }} />

      {/* Datasource config */}
      <DatasourceEditor
        datasource={currentDatasource}
        onChange={handleDatasourceChange}
      />

      {/* Type-specific settings */}
      {renderTypeSettings()}
    </Box>
  );
}
