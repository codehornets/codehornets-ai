/**
 * Factory functions for creating test Workflow entities
 */

export interface WorkflowFactoryOptions {
  id?: string;
  workspace_id?: string;
  name?: string;
  description?: string;
  trigger_type?: 'manual' | 'schedule' | 'webhook' | 'event';
  trigger_config?: Record<string, any>;
  status?: 'draft' | 'active' | 'paused' | 'archived';
  nodes?: any[];
  edges?: any[];
}

let workflowIdCounter = 1;

export function createMockWorkflow(options: WorkflowFactoryOptions = {}) {
  const id = options.id || `workflow-${workflowIdCounter++}`;

  return {
    id,
    workspace_id: options.workspace_id || 'workspace-1',
    name: options.name || `Workflow ${workflowIdCounter}`,
    description: options.description || `Test workflow ${workflowIdCounter}`,
    trigger_type: options.trigger_type || 'manual',
    trigger_config: options.trigger_config || {},
    status: options.status || 'draft',
    nodes: options.nodes || [
      {
        id: 'node-1',
        type: 'trigger',
        data: { label: 'Start' },
        position: { x: 100, y: 100 },
      },
      {
        id: 'node-2',
        type: 'action',
        data: { label: 'Action' },
        position: { x: 300, y: 100 },
      },
    ],
    edges: options.edges || [
      {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
      },
    ],
    created_at: new Date(),
    updated_at: new Date(),
  };
}

export function createMockWorkflows(count: number, baseOptions: WorkflowFactoryOptions = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockWorkflow({
      ...baseOptions,
      name: baseOptions.name || `Workflow ${i + 1}`,
    })
  );
}

export function createMockActiveWorkflow(options: WorkflowFactoryOptions = {}) {
  return createMockWorkflow({
    ...options,
    status: 'active',
  });
}

export function createMockScheduledWorkflow(options: WorkflowFactoryOptions = {}) {
  return createMockWorkflow({
    ...options,
    trigger_type: 'schedule',
    trigger_config: {
      schedule: '0 9 * * *', // Daily at 9am
    },
    status: 'active',
  });
}
