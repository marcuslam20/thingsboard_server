import { ComponentType } from 'react';
import { Widget } from '@/models/dashboard.model';

export interface WidgetTypeInfo {
  type: string;
  widgetType: Widget['type'];
  label: string;
  description: string;
  icon: string;
  defaultSizeX: number;
  defaultSizeY: number;
  component: ComponentType<{ widget: Widget }>;
}

const registry = new Map<string, WidgetTypeInfo>();

export function registerWidget(info: WidgetTypeInfo): void {
  registry.set(info.type, info);
}

export function getWidgetInfo(type: string): WidgetTypeInfo | undefined {
  return registry.get(type);
}

export function getWidgetComponent(type: string): ComponentType<{ widget: Widget }> | undefined {
  return registry.get(type)?.component;
}

export function getAllWidgetTypes(): WidgetTypeInfo[] {
  return Array.from(registry.values());
}

// Register built-in widgets
import ValueCardWidget from './ValueCardWidget';
import LabelWidget from './LabelWidget';
import SimpleTableWidget from './SimpleTableWidget';
import TimeseriesChartWidget from './TimeseriesChartWidget';
import BarChartWidget from './BarChartWidget';
import GaugeWidget from './GaugeWidget';
import AlarmTableWidget from './AlarmTableWidget';
import RpcButtonWidget from './RpcButtonWidget';
import PieChartWidget from './PieChartWidget';
import DigitalGaugeWidget from './DigitalGaugeWidget';
import MapWidget from './MapWidget';
import MarkdownWidget from './MarkdownWidget';
import StatusWidget from './StatusWidget';
import ToggleWidget from './ToggleWidget';
import SliderWidget from './SliderWidget';

registerWidget({
  type: 'value_card',
  widgetType: 'latest',
  label: 'Value Card',
  description: 'Display a single telemetry value',
  icon: 'CreditCard',
  defaultSizeX: 4,
  defaultSizeY: 3,
  component: ValueCardWidget,
});

registerWidget({
  type: 'label',
  widgetType: 'static',
  label: 'Label',
  description: 'Static text or HTML content',
  icon: 'TextFields',
  defaultSizeX: 4,
  defaultSizeY: 2,
  component: LabelWidget,
});

registerWidget({
  type: 'simple_table',
  widgetType: 'latest',
  label: 'Simple Table',
  description: 'Key-value table of latest values',
  icon: 'TableChart',
  defaultSizeX: 6,
  defaultSizeY: 4,
  component: SimpleTableWidget,
});

registerWidget({
  type: 'timeseries_chart',
  widgetType: 'timeseries',
  label: 'Line Chart',
  description: 'Time-series line chart',
  icon: 'ShowChart',
  defaultSizeX: 8,
  defaultSizeY: 5,
  component: TimeseriesChartWidget,
});

registerWidget({
  type: 'bar_chart',
  widgetType: 'timeseries',
  label: 'Bar Chart',
  description: 'Time-series bar chart',
  icon: 'BarChart',
  defaultSizeX: 8,
  defaultSizeY: 5,
  component: BarChartWidget,
});

registerWidget({
  type: 'gauge',
  widgetType: 'latest',
  label: 'Gauge',
  description: 'Circular gauge for a single value',
  icon: 'Speed',
  defaultSizeX: 5,
  defaultSizeY: 5,
  component: GaugeWidget,
});

registerWidget({
  type: 'alarm_table',
  widgetType: 'alarm',
  label: 'Alarm Table',
  description: 'Table of system alarms',
  icon: 'Warning',
  defaultSizeX: 8,
  defaultSizeY: 5,
  component: AlarmTableWidget,
});

registerWidget({
  type: 'rpc_button',
  widgetType: 'rpc',
  label: 'RPC Button',
  description: 'Send RPC commands to a device',
  icon: 'SmartButton',
  defaultSizeX: 4,
  defaultSizeY: 3,
  component: RpcButtonWidget,
});

registerWidget({
  type: 'pie_chart',
  widgetType: 'latest',
  label: 'Pie Chart',
  description: 'Pie/doughnut chart of latest values',
  icon: 'PieChart',
  defaultSizeX: 6,
  defaultSizeY: 5,
  component: PieChartWidget,
});

registerWidget({
  type: 'digital_gauge',
  widgetType: 'latest',
  label: 'Digital Gauge',
  description: 'Circular digital gauge with thresholds',
  icon: 'Dashboard',
  defaultSizeX: 4,
  defaultSizeY: 4,
  component: DigitalGaugeWidget,
});

registerWidget({
  type: 'map',
  widgetType: 'latest',
  label: 'Map',
  description: 'OpenStreetMap with device markers',
  icon: 'Map',
  defaultSizeX: 8,
  defaultSizeY: 6,
  component: MapWidget,
});

registerWidget({
  type: 'markdown',
  widgetType: 'static',
  label: 'Markdown / HTML',
  description: 'Render markdown or HTML content',
  icon: 'Article',
  defaultSizeX: 6,
  defaultSizeY: 4,
  component: MarkdownWidget,
});

registerWidget({
  type: 'status',
  widgetType: 'latest',
  label: 'Status Indicator',
  description: 'Online/offline status indicator',
  icon: 'FiberManualRecord',
  defaultSizeX: 3,
  defaultSizeY: 3,
  component: StatusWidget,
});

registerWidget({
  type: 'toggle',
  widgetType: 'rpc',
  label: 'Toggle Switch',
  description: 'Toggle switch with RPC command',
  icon: 'ToggleOn',
  defaultSizeX: 3,
  defaultSizeY: 3,
  component: ToggleWidget,
});

registerWidget({
  type: 'slider',
  widgetType: 'rpc',
  label: 'Slider Control',
  description: 'Slider with RPC command',
  icon: 'LinearScale',
  defaultSizeX: 5,
  defaultSizeY: 3,
  component: SliderWidget,
});
