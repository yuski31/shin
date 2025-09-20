import mongoose, { Document, ObjectId } from 'mongoose';

export interface IDashboard extends Document {
  _id: ObjectId;
  organizationId: ObjectId;
  name: string;
  description: string;
  type: 'executive' | 'operational' | 'strategic' | 'tactical';
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  permissions: DashboardPermissions;
  isActive: boolean;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayout {
  rows: DashboardRow[];
  columns: number;
  responsive: boolean;
  mobileLayout?: DashboardRow[];
}

export interface DashboardRow {
  id: string;
  height: number;
  widgets: string[]; // Widget IDs
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: WidgetConfig;
  dataSource: DataSource;
  refreshInterval: number; // in seconds
  permissions: WidgetPermissions;
}

export interface WidgetPosition {
  row: number;
  column: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetConfig {
  chartType?: ChartType;
  metrics?: string[];
  filters?: FilterConfig[];
  styling?: WidgetStyling;
  interactions?: InteractionConfig[];
}

export interface DataSource {
  type: 'stream' | 'query' | 'api' | 'static';
  source: string;
  parameters?: Record<string, any>;
  refreshStrategy: 'real-time' | 'interval' | 'manual';
}

export interface DashboardPermissions {
  view: string[]; // User roles that can view
  edit: string[]; // User roles that can edit
  delete: string[]; // User roles that can delete
  share: string[]; // User roles that can share
}

export interface WidgetPermissions {
  view: string[];
  edit: string[];
  delete: string[];
}

export type WidgetType =
  | 'kpi'
  | 'chart'
  | 'table'
  | 'map'
  | 'text'
  | 'image'
  | 'video'
  | 'custom';

export type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'doughnut'
  | 'area'
  | 'scatter'
  | 'heatmap'
  | 'gauge'
  | 'treemap';

export interface FilterConfig {
  field: string;
  operator: FilterOperator;
  value: any;
  label: string;
}

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'in'
  | 'not_in';

export interface WidgetStyling {
  theme: 'light' | 'dark' | 'auto';
  colors: string[];
  fontSize: 'small' | 'medium' | 'large';
  showLegend: boolean;
  showGrid: boolean;
  animations: boolean;
}

export interface InteractionConfig {
  type: 'click' | 'hover' | 'drilldown' | 'filter';
  action: string;
  parameters?: Record<string, any>;
}

const DashboardSchema = new mongoose.Schema<IDashboard>({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['executive', 'operational', 'strategic', 'tactical'],
    required: true,
    index: true
  },
  layout: {
    rows: [{
      id: String,
      height: Number,
      widgets: [String]
    }],
    columns: {
      type: Number,
      default: 12
    },
    responsive: {
      type: Boolean,
      default: true
    },
    mobileLayout: [{
      id: String,
      height: Number,
      widgets: [String]
    }]
  },
  widgets: [{
    id: String,
    type: String,
    title: String,
    position: {
      row: Number,
      column: Number
    },
    size: {
      width: Number,
      height: Number
    },
    config: mongoose.Schema.Types.Mixed,
    dataSource: mongoose.Schema.Types.Mixed,
    refreshInterval: Number,
    permissions: mongoose.Schema.Types.Mixed
  }],
  permissions: {
    view: [String],
    edit: [String],
    delete: [String],
    share: [String]
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
DashboardSchema.index({ organizationId: 1, type: 1 });
DashboardSchema.index({ createdBy: 1, createdAt: -1 });
DashboardSchema.index({ isActive: 1, updatedAt: -1 });

export default mongoose.models.Dashboard || mongoose.model<IDashboard>('Dashboard', DashboardSchema);