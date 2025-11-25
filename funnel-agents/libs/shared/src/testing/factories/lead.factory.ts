/**
 * Factory functions for creating test Lead entities
 */

export interface LeadFactoryOptions {
  id?: string;
  workspaceId?: string;
  campaignId?: string;
  agentId?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source?: string;
  status?: 'new' | 'enriched' | 'qualified' | 'contacted' | 'in_conversation' | 'proposal_sent' | 'won' | 'lost';
  score?: number;
  score_breakdown?: {
    icp_fit: number;
    engagement: number;
    recency: number;
    confidence: number;
  };
  tags?: string[];
  metadata?: Record<string, any>;
  notes?: string;
}

let leadIdCounter = 1;

export function createMockLead(options: LeadFactoryOptions = {}) {
  const id = options.id || `lead-${leadIdCounter++}`;

  return {
    id,
    workspaceId: options.workspaceId || 'workspace-1',
    campaignId: options.campaignId,
    agentId: options.agentId,
    name: options.name || `Lead ${leadIdCounter}`,
    email: options.email || `lead${leadIdCounter}@example.com`,
    phone: options.phone || `+1-555-${String(leadIdCounter).padStart(4, '0')}`,
    company: options.company || `Company ${leadIdCounter}`,
    jobTitle: options.jobTitle,
    source: options.source || 'website',
    status: options.status || 'new',
    score: options.score ?? 0,
    score_breakdown: options.score_breakdown || {
      icp_fit: 0,
      engagement: 0,
      recency: 0,
      confidence: 0,
    },
    tags: options.tags || [],
    metadata: options.metadata || {},
    notes: options.notes,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createMockLeads(count: number, baseOptions: LeadFactoryOptions = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockLead({
      ...baseOptions,
      email: baseOptions.email || `lead${i + 1}@example.com`,
      name: baseOptions.name || `Lead ${i + 1}`,
    })
  );
}

export function createMockQualifiedLead(options: LeadFactoryOptions = {}) {
  return createMockLead({
    ...options,
    status: 'qualified',
    score: 85,
    score_breakdown: {
      icp_fit: 90,
      engagement: 80,
      recency: 85,
      confidence: 85,
    },
  });
}

export function createMockUnqualifiedLead(options: LeadFactoryOptions = {}) {
  return createMockLead({
    ...options,
    status: 'contacted',
    score: 35,
    score_breakdown: {
      icp_fit: 40,
      engagement: 30,
      recency: 35,
      confidence: 35,
    },
  });
}
