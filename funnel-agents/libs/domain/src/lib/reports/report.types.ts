export enum ReportType {
  CAMPAIGN_PERFORMANCE = 'campaign_performance',
  LEAD_ANALYTICS = 'lead_analytics',
  AGENT_METRICS = 'agent_metrics',
  CONTENT_PERFORMANCE = 'content_performance',
  CONVERSION_FUNNEL = 'conversion_funnel',
  ROI_ANALYSIS = 'roi_analysis',
  CUSTOM = 'custom',
}

export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ReportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  EXCEL = 'excel',
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: unknown;
}

export interface ReportConfig {
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: ReportFilter[];
  groupBy?: string[];
  metrics?: string[];
  dimensions?: string[];
  sortBy?: {
    field: string;
    order: 'asc' | 'desc';
  };
  limit?: number;
}

export interface ReportData {
  summary?: Record<string, unknown>;
  rows: Record<string, unknown>[];
  totals?: Record<string, unknown>;
  generatedAt: Date;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  recipients: string[];
  format: ReportFormat;
}
