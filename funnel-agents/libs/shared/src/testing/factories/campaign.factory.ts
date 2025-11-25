/**
 * Factory functions for creating test Campaign entities
 */

export interface CampaignFactoryOptions {
  id?: string;
  workspace_id?: string;
  name?: string;
  description?: string;
  type?: 'email' | 'social' | 'content' | 'multi_channel';
  status?: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived';
  start_date?: Date;
  end_date?: Date;
  target_audience?: Record<string, any>;
  configuration?: Record<string, any>;
  metrics?: {
    sent?: number;
    delivered?: number;
    opened?: number;
    clicked?: number;
    converted?: number;
  };
}

let campaignIdCounter = 1;

export function createMockCampaign(options: CampaignFactoryOptions = {}) {
  const id = options.id || `campaign-${campaignIdCounter++}`;

  return {
    id,
    workspace_id: options.workspace_id || 'workspace-1',
    name: options.name || `Campaign ${campaignIdCounter}`,
    description: options.description || `Test campaign ${campaignIdCounter}`,
    type: options.type || 'email',
    status: options.status || 'draft',
    start_date: options.start_date || new Date(),
    end_date: options.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    target_audience: options.target_audience || {
      segments: ['all'],
      filters: {},
    },
    configuration: options.configuration || {
      template_id: 'template-1',
      send_time: '09:00',
    },
    metrics: options.metrics || {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
    },
    created_at: new Date(),
    updated_at: new Date(),
  };
}

export function createMockCampaigns(count: number, baseOptions: CampaignFactoryOptions = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockCampaign({
      ...baseOptions,
      name: baseOptions.name || `Campaign ${i + 1}`,
    })
  );
}

export function createMockActiveCampaign(options: CampaignFactoryOptions = {}) {
  return createMockCampaign({
    ...options,
    status: 'active',
    metrics: {
      sent: 1000,
      delivered: 980,
      opened: 450,
      clicked: 120,
      converted: 35,
    },
  });
}

export function createMockEmailCampaign(options: CampaignFactoryOptions = {}) {
  return createMockCampaign({
    ...options,
    type: 'email',
  });
}
