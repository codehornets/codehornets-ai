/**
 * Factory functions for creating test Task entities
 */

export interface TaskFactoryOptions {
  id?: string;
  workspace_id?: string;
  title?: string;
  description?: string;
  type?: 'lead_qualification' | 'content_generation' | 'email_outreach' | 'data_analysis' | 'custom';
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_agent_id?: string;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error?: string;
}

let taskIdCounter = 1;

export function createMockTask(options: TaskFactoryOptions = {}) {
  const id = options.id || `task-${taskIdCounter++}`;

  return {
    id,
    workspace_id: options.workspace_id || 'workspace-1',
    title: options.title || `Task ${taskIdCounter}`,
    description: options.description || `Test task ${taskIdCounter}`,
    type: options.type || 'custom',
    status: options.status || 'pending',
    priority: options.priority || 'medium',
    assigned_agent_id: options.assigned_agent_id || null,
    input_data: options.input_data || {},
    output_data: options.output_data || null,
    error: options.error || null,
    created_at: new Date(),
    updated_at: new Date(),
    started_at: options.status === 'running' || options.status === 'completed' ? new Date() : null,
    completed_at: options.status === 'completed' ? new Date() : null,
  };
}

export function createMockTasks(count: number, baseOptions: TaskFactoryOptions = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockTask({
      ...baseOptions,
      title: baseOptions.title || `Task ${i + 1}`,
    })
  );
}

export function createMockPendingTask(options: TaskFactoryOptions = {}) {
  return createMockTask({
    ...options,
    status: 'pending',
  });
}

export function createMockRunningTask(options: TaskFactoryOptions = {}) {
  return createMockTask({
    ...options,
    status: 'running',
    started_at: new Date(),
  });
}

export function createMockCompletedTask(options: TaskFactoryOptions = {}) {
  return createMockTask({
    ...options,
    status: 'completed',
    started_at: new Date(Date.now() - 60000),
    completed_at: new Date(),
    output_data: { result: 'success' },
  });
}

export function createMockFailedTask(options: TaskFactoryOptions = {}) {
  return createMockTask({
    ...options,
    status: 'failed',
    started_at: new Date(Date.now() - 60000),
    completed_at: new Date(),
    error: 'Task execution failed',
  });
}
