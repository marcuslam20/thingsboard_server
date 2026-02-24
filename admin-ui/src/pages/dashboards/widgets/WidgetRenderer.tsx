import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Widget } from '@/models/dashboard.model';
import { getWidgetComponent } from './WidgetRegistry';

interface WidgetRendererProps {
  widget: Widget;
}

export default function WidgetRenderer({ widget }: WidgetRendererProps) {
  // Try to resolve by widget's custom type field first, then by typeFullFqn
  const widgetType = (widget.config?.settings as Record<string, unknown>)?.widgetType as string | undefined;
  const Component = getWidgetComponent(widgetType || '') ||
    (widget.typeFullFqn ? getWidgetComponent(widget.typeFullFqn) : undefined);

  if (Component) {
    return <Component widget={widget} />;
  }

  // Fallback: try to match by widget.type category
  const fallbackInfo = getFallbackByCategory(widget.type);
  if (fallbackInfo) {
    const FallbackComponent = getWidgetComponent(fallbackInfo);
    if (FallbackComponent) {
      return <FallbackComponent widget={widget} />;
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: 1 }}>
      <Typography color="text.secondary" variant="body2">
        Unknown widget type
      </Typography>
      <Typography color="text.disabled" variant="caption">
        {widget.typeFullFqn || widget.type || 'unspecified'}
      </Typography>
    </Box>
  );
}

function getFallbackByCategory(type: Widget['type']): string | null {
  switch (type) {
    case 'latest': return 'value_card';
    case 'timeseries': return 'timeseries_chart';
    case 'alarm': return 'alarm_table';
    case 'rpc': return 'rpc_button';
    case 'static': return 'label';
    default: return null;
  }
}

// Ensure the registry is initialized
import './WidgetRegistry';
