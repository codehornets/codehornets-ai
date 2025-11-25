/**
 * Factory functions for creating test Agent entities
 */

export interface AgentFactoryOptions {
  id?: string;
  workspace_id?: string;
  name?: string;
  description?: string;
  type?: 'lead_qualifier' | 'content_writer' | 'email_sender' | 'data_analyst' | 'custom';
  status?: 'active' | 'inactive' | 'training';
  model?: string;
  system_prompt?: string;
  capabilities?: string[];
  configuration?: Record<string, any>;
}

let agentIdCounter = 1;

export function createMockAgent(options: AgentFactoryOptions = {}) {
  const id = options.id || `agent-${agentIdCounter++}`;

  return {
    id,
    workspace_id: options.workspace_id || 'workspace-1',
    name: options.name || `Agent ${agentIdCounter}`,
    description: options.description || `Test agent ${agentIdCounter}`,
    type: options.type || 'custom',
    status: options.status || 'active',
    model: options.model || 'gpt-4',
    system_prompt: options.system_prompt || 'You are a helpful AI assistant.',
    capabilities: options.capabilities || ['text_generation', 'data_analysis'],
    configuration: options.configuration || {
      temperature: 0.7,
      max_tokens: 1000,
    },
    created_at: new Date(),
    updated_at: new Date(),
  };
}

export function createMockAgents(count: number, baseOptions: AgentFactoryOptions = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockAgent({
      ...baseOptions,
      name: baseOptions.name || `Agent ${i + 1}`,
    })
  );
}

export function createMockLeadQualifierAgent(options: AgentFactoryOptions = {}) {
  return createMockAgent({
    ...options,
    type: 'lead_qualifier',
    name: options.name || 'Lead Qualifier Agent',
    capabilities: ['lead_scoring', 'data_analysis', 'classification'],
    system_prompt: 'You are an expert at qualifying sales leads based on ICP criteria.',
  });
}

export function createMockContentWriterAgent(options: AgentFactoryOptions = {}) {
  return createMockAgent({
    ...options,
    type: 'content_writer',
    name: options.name || 'Content Writer Agent',
    capabilities: ['text_generation', 'copywriting', 'seo_optimization'],
    system_prompt: 'You are an expert content writer specializing in marketing copy.',
  });
}
