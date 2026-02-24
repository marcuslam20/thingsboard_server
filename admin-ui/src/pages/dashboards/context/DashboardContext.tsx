import { createContext, useContext, useReducer, useCallback, ReactNode, Dispatch } from 'react';
import { Dashboard, Widget, WidgetConfig, WidgetLayout } from '@/models/dashboard.model';
import { dashboardApi } from '@/api/dashboard.api';

// --- State ---

export interface DashboardEditorState {
  dashboard: Dashboard | null;
  originalDashboard: Dashboard | null;
  isEdit: boolean;
  isDirty: boolean;
  selectedWidgetId: string | null;
  loading: boolean;
  saving: boolean;
}

const initialState: DashboardEditorState = {
  dashboard: null,
  originalDashboard: null,
  isEdit: false,
  isDirty: false,
  selectedWidgetId: null,
  loading: false,
  saving: false,
};

// --- Actions ---

export type DashboardAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_DASHBOARD'; dashboard: Dashboard }
  | { type: 'TOGGLE_EDIT' }
  | { type: 'ADD_WIDGET'; widget: Widget }
  | { type: 'REMOVE_WIDGET'; widgetId: string }
  | { type: 'UPDATE_WIDGET'; widgetId: string; config: Partial<WidgetConfig> }
  | { type: 'UPDATE_WIDGET_TITLE'; widgetId: string; title: string }
  | { type: 'UPDATE_LAYOUTS'; layouts: Array<{ i: string; x: number; y: number; w: number; h: number }> }
  | { type: 'SELECT_WIDGET'; widgetId: string | null }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_DONE'; dashboard: Dashboard }
  | { type: 'SAVE_ERROR' }
  | { type: 'REVERT' }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<Dashboard['configuration']> };

// --- Helpers ---

function updateWidgets(dashboard: Dashboard, updater: (widgets: Record<string, Widget>) => Record<string, Widget>): Dashboard {
  const config = dashboard.configuration || {};
  const widgets = config.widgets || {};
  const newWidgets = updater(widgets);

  // Also update layout in default state
  const states = config.states || {};
  const defaultState = states.default || { name: 'default', root: true, layouts: { main: { widgets: {} } } };
  const mainLayout = defaultState.layouts?.main || { widgets: {} };
  const layoutWidgets: Record<string, WidgetLayout> = {};
  for (const [id, w] of Object.entries(newWidgets)) {
    layoutWidgets[id] = { col: w.col, row: w.row, sizeX: w.sizeX, sizeY: w.sizeY };
  }

  return {
    ...dashboard,
    configuration: {
      ...config,
      widgets: newWidgets,
      states: {
        ...states,
        default: {
          ...defaultState,
          layouts: {
            ...defaultState.layouts,
            main: {
              ...mainLayout,
              widgets: layoutWidgets,
            },
          },
        },
      },
    },
  };
}

// --- Reducer ---

function dashboardReducer(state: DashboardEditorState, action: DashboardAction): DashboardEditorState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };

    case 'SET_DASHBOARD':
      return {
        ...state,
        dashboard: action.dashboard,
        originalDashboard: action.dashboard,
        loading: false,
        isDirty: false,
      };

    case 'TOGGLE_EDIT':
      if (state.isEdit) {
        // Exiting edit mode without saving — revert
        return {
          ...state,
          isEdit: false,
          isDirty: false,
          selectedWidgetId: null,
          dashboard: state.originalDashboard,
        };
      }
      return { ...state, isEdit: true };

    case 'ADD_WIDGET': {
      if (!state.dashboard) return state;
      const w = action.widget;
      const updated = updateWidgets(state.dashboard, (widgets) => ({
        ...widgets,
        [w.id]: w,
      }));
      return { ...state, dashboard: updated, isDirty: true };
    }

    case 'REMOVE_WIDGET': {
      if (!state.dashboard) return state;
      const updated = updateWidgets(state.dashboard, (widgets) => {
        const copy = { ...widgets };
        delete copy[action.widgetId];
        return copy;
      });
      return {
        ...state,
        dashboard: updated,
        isDirty: true,
        selectedWidgetId: state.selectedWidgetId === action.widgetId ? null : state.selectedWidgetId,
      };
    }

    case 'UPDATE_WIDGET': {
      if (!state.dashboard) return state;
      const updated = updateWidgets(state.dashboard, (widgets) => {
        const existing = widgets[action.widgetId];
        if (!existing) return widgets;
        return {
          ...widgets,
          [action.widgetId]: {
            ...existing,
            config: { ...existing.config, ...action.config },
          },
        };
      });
      return { ...state, dashboard: updated, isDirty: true };
    }

    case 'UPDATE_WIDGET_TITLE': {
      if (!state.dashboard) return state;
      const updated = updateWidgets(state.dashboard, (widgets) => {
        const existing = widgets[action.widgetId];
        if (!existing) return widgets;
        return {
          ...widgets,
          [action.widgetId]: {
            ...existing,
            title: action.title,
            config: { ...existing.config, title: action.title },
          },
        };
      });
      return { ...state, dashboard: updated, isDirty: true };
    }

    case 'UPDATE_LAYOUTS': {
      if (!state.dashboard) return state;
      const config = state.dashboard.configuration || {};
      const widgets = { ...(config.widgets || {}) };
      for (const layout of action.layouts) {
        if (widgets[layout.i]) {
          widgets[layout.i] = {
            ...widgets[layout.i],
            col: layout.x,
            row: layout.y,
            sizeX: layout.w,
            sizeY: layout.h,
          };
        }
      }
      const updated = updateWidgets({ ...state.dashboard, configuration: { ...config, widgets } }, (w) => w);
      return { ...state, dashboard: updated, isDirty: true };
    }

    case 'SELECT_WIDGET':
      return { ...state, selectedWidgetId: action.widgetId };

    case 'SAVE_START':
      return { ...state, saving: true };

    case 'SAVE_DONE':
      return {
        ...state,
        saving: false,
        isDirty: false,
        dashboard: action.dashboard,
        originalDashboard: action.dashboard,
      };

    case 'SAVE_ERROR':
      return { ...state, saving: false };

    case 'REVERT':
      return {
        ...state,
        dashboard: state.originalDashboard,
        isDirty: false,
        selectedWidgetId: null,
      };

    case 'UPDATE_SETTINGS': {
      if (!state.dashboard) return state;
      return {
        ...state,
        isDirty: true,
        dashboard: {
          ...state.dashboard,
          configuration: {
            ...state.dashboard.configuration,
            ...(action.settings || {}),
          },
        },
      };
    }

    default:
      return state;
  }
}

// --- Context ---

interface DashboardContextValue {
  state: DashboardEditorState;
  dispatch: Dispatch<DashboardAction>;
  saveDashboard: () => Promise<void>;
  loadDashboard: (dashboardId: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  const loadDashboard = useCallback(async (dashboardId: string) => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const dashboard = await dashboardApi.getDashboard(dashboardId);
      dispatch({ type: 'SET_DASHBOARD', dashboard });
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, []);

  const saveDashboard = useCallback(async () => {
    if (!state.dashboard) return;
    dispatch({ type: 'SAVE_START' });
    try {
      const saved = await dashboardApi.saveDashboard(state.dashboard);
      dispatch({ type: 'SAVE_DONE', dashboard: saved });
    } catch (err) {
      console.error('Failed to save dashboard:', err);
      dispatch({ type: 'SAVE_ERROR' });
    }
  }, [state.dashboard]);

  return (
    <DashboardContext.Provider value={{ state, dispatch, saveDashboard, loadDashboard }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboardContext must be used within DashboardProvider');
  return ctx;
}
