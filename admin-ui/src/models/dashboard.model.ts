import { DashboardId, TenantId, CustomerId, EntityId } from './id.model';
import { BaseData } from './base-data.model';

// --- Entity Alias ---

export interface EntityAliasFilter {
  type: string;
  resolveMultiple?: boolean;
  singleEntity?: EntityId;
  entityType?: string;
  entityList?: string[];
  entityNameFilter?: string;
  stateEntity?: boolean;
  defaultStateEntity?: EntityId;
  [key: string]: unknown;
}

export interface EntityAlias {
  id: string;
  alias: string;
  filter: EntityAliasFilter;
}

// --- Timewindow ---

export interface Timewindow {
  displayValue?: string;
  hideInterval?: boolean;
  hideAggregation?: boolean;
  hideAggInterval?: boolean;
  selectedTab?: number;
  realtime?: {
    realtimeType?: number;
    timewindowMs?: number;
    quickInterval?: string;
    interval?: number;
  };
  history?: {
    historyType?: number;
    timewindowMs?: number;
    interval?: number;
    fixedTimewindow?: {
      startTimeMs: number;
      endTimeMs: number;
    };
    quickInterval?: string;
  };
  aggregation?: {
    type?: string;
    limit?: number;
  };
}

// --- Data Key & Datasource ---

export interface DataKey {
  name: string;
  type: 'timeseries' | 'attribute' | 'function' | 'alarm' | 'entityField';
  label?: string;
  color?: string;
  settings?: Record<string, unknown>;
  funcBody?: string;
  postFuncBody?: string;
  units?: string;
  decimals?: number;
}

export interface Datasource {
  type: 'device' | 'entity' | 'function' | 'entityCount' | 'alarmCount';
  deviceId?: string;
  entityAliasId?: string;
  entityType?: string;
  entityId?: string;
  name?: string;
  dataKeys?: DataKey[];
  latestDataKeys?: DataKey[];
  alarmFilterConfig?: Record<string, unknown>;
}

// --- Widget ---

export interface WidgetConfig {
  title?: string;
  showTitle?: boolean;
  backgroundColor?: string;
  color?: string;
  padding?: string;
  margin?: string;
  settings?: Record<string, unknown>;
  datasources?: Datasource[];
  timewindow?: Timewindow;
  actions?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Widget {
  id: string;
  typeFullFqn?: string;
  type: 'timeseries' | 'latest' | 'rpc' | 'alarm' | 'static';
  title?: string;
  sizeX: number;
  sizeY: number;
  row: number;
  col: number;
  config: WidgetConfig;
}

// --- Grid & Layout ---

export interface GridSettings {
  columns: number;
  margin: number;
  outerMargin?: boolean;
  rowHeight?: number;
  backgroundColor?: string;
  backgroundImageUrl?: string;
  backgroundSizeMode?: string;
  autoFillHeight?: boolean;
  mobileAutoFillHeight?: boolean;
  mobileRowHeight?: number;
}

export interface WidgetLayout {
  col: number;
  row: number;
  sizeX: number;
  sizeY: number;
  mobileCol?: number;
  mobileRow?: number;
  mobileSizeX?: number;
  mobileSizeY?: number;
}

export interface DashboardLayoutInfo {
  gridSettings?: GridSettings;
  widgets?: Record<string, WidgetLayout>;
}

// --- Dashboard State ---

export interface DashboardState {
  name: string;
  root?: boolean;
  layouts: {
    main: DashboardLayoutInfo;
    right?: DashboardLayoutInfo;
  };
}

// --- Dashboard Settings ---

export interface DashboardSettings {
  showTitle?: boolean;
  showDashboardsSelect?: boolean;
  showEntitiesSelect?: boolean;
  showDashboardTimewindow?: boolean;
  showDashboardExport?: boolean;
  toolbarAlwaysOpen?: boolean;
  hideToolbar?: boolean;
  titleColor?: string;
  dashboardCss?: string;
  stateControllerId?: string;
}

// --- Dashboard Configuration ---

export interface DashboardConfiguration {
  settings?: DashboardSettings;
  widgets?: Record<string, Widget>;
  states?: Record<string, DashboardState>;
  entityAliases?: Record<string, EntityAlias>;
  timewindow?: Timewindow;
  description?: string;
}

// --- Dashboard Entity ---

export interface Dashboard extends BaseData<DashboardId> {
  tenantId: TenantId;
  title: string;
  image?: string;
  mobileHide?: boolean;
  mobileOrder?: number;
  configuration?: DashboardConfiguration;
  assignedCustomers?: Array<{
    customerId: CustomerId;
    title: string;
    public?: boolean;
  }>;
}

export interface DashboardInfo extends BaseData<DashboardId> {
  tenantId: TenantId;
  title: string;
  image?: string;
  mobileHide?: boolean;
  mobileOrder?: number;
  assignedCustomers?: Array<{
    customerId: CustomerId;
    title: string;
    public?: boolean;
  }>;
}

// --- Default values ---

export const DEFAULT_GRID_SETTINGS: GridSettings = {
  columns: 24,
  margin: 10,
  rowHeight: 50,
  backgroundColor: '#FFFFFF',
  autoFillHeight: false,
};

export const DEFAULT_WIDGET_SIZE = { sizeX: 6, sizeY: 4 };

export function createEmptyDashboardConfig(): DashboardConfiguration {
  return {
    settings: { showTitle: true },
    widgets: {},
    states: {
      default: {
        name: 'default',
        root: true,
        layouts: {
          main: {
            gridSettings: { ...DEFAULT_GRID_SETTINGS },
            widgets: {},
          },
        },
      },
    },
    entityAliases: {},
    timewindow: {
      realtime: { realtimeType: 0, timewindowMs: 60000, interval: 1000 },
    },
  };
}
