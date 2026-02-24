import { useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ResponsiveGridLayout, useContainerWidth, type LayoutItem, type Layout, type ResponsiveLayouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import WidgetContainer from './WidgetContainer';
import { useDashboardContext } from '../context/DashboardContext';
import { DEFAULT_GRID_SETTINGS, Widget } from '@/models/dashboard.model';

export default function DashboardGrid() {
  const { state, dispatch } = useDashboardContext();
  const { dashboard, isEdit } = state;

  const { width, containerRef } = useContainerWidth({ initialWidth: 1200 });

  const config = dashboard?.configuration;
  const widgets = config?.widgets || {};
  const gridSettings = config?.states?.default?.layouts?.main?.gridSettings || DEFAULT_GRID_SETTINGS;

  const widgetList: Widget[] = useMemo(() => Object.values(widgets), [widgets]);

  const layoutItems: LayoutItem[] = useMemo(() =>
    widgetList.map((w) => ({
      i: w.id,
      x: w.col,
      y: w.row,
      w: w.sizeX,
      h: w.sizeY,
      minW: 2,
      minH: 2,
    })),
    [widgetList],
  );

  const handleLayoutChange = useCallback(
    (layout: Layout, _layouts: ResponsiveLayouts) => {
      if (!isEdit) return;
      dispatch({
        type: 'UPDATE_LAYOUTS',
        layouts: layout.map((l) => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h })),
      });
    },
    [isEdit, dispatch],
  );

  if (widgetList.length === 0 && !isEdit) {
    return (
      <Box ref={containerRef} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Typography color="text.secondary" variant="h6">
          This dashboard has no widgets. Click Edit to add widgets.
        </Typography>
      </Box>
    );
  }

  if (widgetList.length === 0 && isEdit) {
    return (
      <Box ref={containerRef} sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 400,
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        m: 2,
      }}>
        <Typography color="text.secondary" variant="h6">
          Click "Add Widget" to get started
        </Typography>
      </Box>
    );
  }

  const marginVal: readonly [number, number] = [gridSettings.margin || 10, gridSettings.margin || 10];

  return (
    <Box
      ref={containerRef}
      sx={{
        flex: 1,
        overflow: 'auto',
        bgcolor: gridSettings.backgroundColor || '#FFFFFF',
        p: `${gridSettings.margin || 10}px`,
        '& .react-grid-item.react-grid-placeholder': {
          bgcolor: 'primary.main',
          opacity: 0.2,
          borderRadius: 1,
        },
      }}
    >
      <ResponsiveGridLayout
        className="dashboard-grid"
        width={width}
        layouts={{ lg: layoutItems, md: layoutItems, sm: layoutItems, xs: layoutItems }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: gridSettings.columns, md: gridSettings.columns, sm: 12, xs: 6 }}
        rowHeight={gridSettings.rowHeight || 50}
        margin={marginVal}
        dragConfig={{ enabled: isEdit, handle: '.widget-drag-handle' }}
        resizeConfig={{ enabled: isEdit }}
        onLayoutChange={handleLayoutChange}
      >
        {widgetList.map((w) => (
          <div key={w.id}>
            <WidgetContainer widget={w} />
          </div>
        ))}
      </ResponsiveGridLayout>
    </Box>
  );
}
