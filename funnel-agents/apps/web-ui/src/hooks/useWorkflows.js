import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/api/client';
import { toast } from 'sonner';

/**
 * Hook to fetch all workflows
 */
export function useWorkflows(options = {}) {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      try {
        return await client.entities.Workflow?.list?.('-updated_date') || [];
      } catch (err) {
        console.warn('Workflow entity not available, trying function...');
        const result = await client.functions.invoke('getWorkflows', {});
        return result?.data || [];
      }
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    ...options,
  });
}

/**
 * Hook to fetch a single workflow by ID
 */
export function useWorkflow(workflowId, options = {}) {
  return useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: async () => {
      if (!workflowId) return null;
      try {
        return await client.entities.Workflow?.get?.(workflowId);
      } catch (err) {
        const result = await client.functions.invoke('getWorkflow', {
          workflow_id: workflowId,
        });
        return result?.data;
      }
    },
    enabled: !!workflowId,
    ...options,
  });
}

/**
 * Hook to fetch workflow templates
 */
export function useWorkflowTemplates(options = {}) {
  return useQuery({
    queryKey: ['workflow-templates'],
    queryFn: async () => {
      try {
        return await client.entities.WorkflowTemplate?.list?.('-popularity') || [];
      } catch (err) {
        console.warn('WorkflowTemplate entity not available, trying function...');
        const result = await client.functions.invoke('getWorkflowTemplates', {});
        return result?.data || [];
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch workflow execution history
 */
export function useWorkflowRuns(workflowId, options = {}) {
  return useQuery({
    queryKey: ['workflow-runs', workflowId],
    queryFn: async () => {
      if (!workflowId) return [];
      try {
        const runs = await client.entities.WorkflowRun?.list?.();
        return runs.filter(run => run.workflow_id === workflowId);
      } catch (err) {
        const result = await client.functions.invoke('getWorkflowRuns', {
          workflow_id: workflowId,
        });
        return result?.data || [];
      }
    },
    enabled: !!workflowId,
    staleTime: 30 * 1000, // Cache for 30 seconds (more frequent updates for runs)
    ...options,
  });
}

/**
 * Hook to create a workflow
 */
export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      try {
        return await client.entities.Workflow?.create?.(data);
      } catch (err) {
        const result = await client.functions.invoke('createWorkflow', { workflow: data });
        return result?.data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow created');
      return data;
    },
    onError: (error) => {
      toast.error(`Failed to create workflow: ${error.message}`);
    },
  });
}

/**
 * Hook to update a workflow
 */
export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      try {
        return await client.entities.Workflow?.update?.(id, data);
      } catch (err) {
        const result = await client.functions.invoke('updateWorkflow', {
          workflow_id: id,
          updates: data,
        });
        return result?.data;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', variables.id] });
      toast.success('Workflow updated');
    },
    onError: (error) => {
      toast.error(`Failed to update workflow: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a workflow
 */
export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      try {
        return await client.entities.Workflow?.delete?.(id);
      } catch (err) {
        const result = await client.functions.invoke('deleteWorkflow', { workflow_id: id });
        return result?.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete workflow: ${error.message}`);
    },
  });
}

/**
 * Hook to duplicate a workflow
 */
export function useDuplicateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workflow) => {
      const duplicatedData = {
        ...workflow,
        name: `${workflow.name} (Copy)`,
        status: 'draft',
        runs_count: 0,
        success_count: 0,
        last_run_at: null,
      };
      delete duplicatedData.id;
      delete duplicatedData.created_at;
      delete duplicatedData.updated_at;

      try {
        return await client.entities.Workflow?.create?.(duplicatedData);
      } catch (err) {
        const result = await client.functions.invoke('duplicateWorkflow', {
          workflow_id: workflow.id,
        });
        return result?.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow duplicated');
    },
    onError: (error) => {
      toast.error(`Failed to duplicate workflow: ${error.message}`);
    },
  });
}

/**
 * Hook to execute a workflow
 */
export function useExecuteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workflowId, workflow, triggerData = {} }) => {
      try {
        // Create workflow run record
        const run = await client.entities.WorkflowRun?.create?.({
          workflow_id: workflowId || workflow?.id,
          workflow_name: workflow?.name || 'Unnamed Workflow',
          status: 'running',
          trigger_type: triggerData.type || 'manual',
          trigger_data: triggerData,
          started_at: new Date().toISOString(),
        });

        // Execute the workflow
        const result = await client.functions.invoke('executeWorkflow', {
          workflow_id: workflowId || workflow?.id,
          run_id: run?.id,
          trigger_data: triggerData,
        });

        return { run, result: result?.data };
      } catch (err) {
        console.error('Workflow execution error:', err);
        throw err;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-runs', variables.workflowId || variables.workflow?.id] });
      toast.success('Workflow execution started');
    },
    onError: (error) => {
      toast.error(`Failed to execute workflow: ${error.message}`);
    },
  });
}

/**
 * Hook for real-time workflow status updates via WebSocket
 * Note: This requires WebSocket setup in base44 client
 */
export function useWorkflowStatusUpdates(workflowId) {
  const queryClient = useQueryClient();

  // TODO: Implement WebSocket connection when available
  // For now, we'll use polling as fallback
  return useQuery({
    queryKey: ['workflow-status', workflowId],
    queryFn: async () => {
      if (!workflowId) return null;
      try {
        const workflow = await client.entities.Workflow?.get?.(workflowId);
        return workflow?.status;
      } catch (err) {
        return null;
      }
    },
    enabled: !!workflowId,
    refetchInterval: 5000, // Poll every 5 seconds
    onSuccess: (status) => {
      // Invalidate workflow data when status changes
      queryClient.invalidateQueries({ queryKey: ['workflow', workflowId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-runs', workflowId] });
    },
  });
}
