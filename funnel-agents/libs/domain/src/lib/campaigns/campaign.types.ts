export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum CampaignType {
  EMAIL = 'email',
  SMS = 'sms',
  SOCIAL = 'social',
  ADS = 'ads',
  MULTI_CHANNEL = 'multi_channel',
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  roi: number;
}

export interface CampaignTarget {
  audienceId?: string;
  segments?: string[];
  filters?: Record<string, unknown>;
}
