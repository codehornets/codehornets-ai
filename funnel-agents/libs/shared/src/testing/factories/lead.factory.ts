/**
 * Factory functions for creating test Lead entities
 */

export interface LeadFactoryOptions {
  id?: string;
  workspace_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status?: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  score?: number;
  score_breakdown?: {
    icp_fit: number;
    engagement: number;
    recency: number;
    confidence: number;
  };
  tags?: string[];
  custom_fields?: Record<string, any>;
}

let leadIdCounter = 1;

export function createMockLead(options: LeadFactoryOptions = {}) {
  const id = options.id || `lead-${leadIdCounter++}`;

  return {
    id,
    workspace_id: options.workspace_id || 'workspace-1',
    name: options.name || `Lead ${leadIdCounter}`,
    email: options.email || `lead${leadIdCounter}@example.com`,
    phone: options.phone || `+1-555-${String(leadIdCounter).padStart(4, '0')}`,
    company: options.company || `Company ${leadIdCounter}`,
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
    custom_fields: options.custom_fields || {},
    created_at: new Date(),
    updated_at: new Date(),
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
