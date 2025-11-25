import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, GitBranch, Play, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import WorkflowCard from '@/components/workflows/WorkflowCard';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export default function Workflows() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch user's workflows
  const { data: workflows = [], isLoading: isLoadingWorkflows } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      try {
        const response = await client.get('/api/automations/workflows');
        return response || [];
      } catch (err) {
        console.error('Failed to fetch workflows:', err);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  // Fetch workflow templates from database
  const { data: workflowTemplates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['workflow-templates'],
    queryFn: async () => {
      try {
        const response = await client.get('/api/automations/workflows/templates');
        return response || [];
      } catch (err) {
        console.error('Failed to fetch workflow templates:', err);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch agents for workflow templates
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      try {
        const response = await client.get('/api/agents');
        return response || [];
      } catch (err) {
        console.error('Failed to fetch agents:', err);
        return [];
      }
    },
    initialData: [],
  });

  // Create workflow mutation
  const createWorkflowMutation = useMutation({
    mutationFn: async (data) => {
      return await client.post('/api/automations/workflows', data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      navigate(createPageUrl('WorkflowBuilder') + `?id=${data.id}`);
      toast.success('Workflow created');
    },
    onError: (error) => {
      toast.error(`Failed to create workflow: ${error.message}`);
    },
  });

  // Update workflow mutation
  const updateWorkflowMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await client.patch(`/api/automations/workflows/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow updated');
    },
    onError: (error) => {
      toast.error(`Failed to update workflow: ${error.message}`);
    },
  });

  // Delete workflow mutation
  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id) => {
      return await client.delete(`/api/automations/workflows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete workflow: ${error.message}`);
    },
  });

  // Duplicate workflow mutation
  const duplicateWorkflowMutation = useMutation({
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

      return await client.post('/api/automations/workflows', duplicatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow duplicated');
    },
    onError: (error) => {
      toast.error(`Failed to duplicate workflow: ${error.message}`);
    },
  });

  // Execute workflow mutation
  const runWorkflowMutation = useMutation({
    mutationFn: async (workflow) => {
      try {
        // Execute the workflow
        const result = await client.post(`/api/automations/workflows/${workflow.id}/execute`, {
          trigger_type: 'manual',
          trigger_data: {},
        });

        return result;
      } catch (err) {
        console.error('Workflow execution error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-runs'] });
      toast.success('Workflow execution started');
    },
    onError: (error) => {
      toast.error(`Failed to execute workflow: ${error.message}`);
    },
  });

  const handleCreateWorkflow = () => {
    createWorkflowMutation.mutate({
      name: 'New Workflow',
      description: 'Describe what this automation does',
      status: 'draft',
      trigger_type: 'manual',
      nodes: [],
      connections: [],
      variables: {},
    });
  };

  const handleUseTemplate = (template) => {
    createWorkflowMutation.mutate({
      name: template.name,
      description: template.description,
      status: 'draft',
      nodes: template.nodes || [],
      connections: template.connections || [],
      trigger_type: template.trigger_type || 'manual',
      variables: template.variables || {},
    });
  };

  const handleToggleStatus = (workflow) => {
    const newStatus = workflow.status === 'active' ? 'paused' : 'active';
    updateWorkflowMutation.mutate({
      id: workflow.id,
      data: { ...workflow, status: newStatus },
    });
  };

  const handleDuplicate = (workflow) => {
    duplicateWorkflowMutation.mutate(workflow);
  };

  const filteredWorkflows = workflows.filter(w => {
    if (statusFilter === 'all') return true;
    return w.status === statusFilter;
  });

  // Loading state
  if (isLoadingWorkflows) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Automations</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} •
            {workflows.filter(w => w.status === 'active').length} active
          </p>
        </div>
        <Button
          onClick={handleCreateWorkflow}
          disabled={createWorkflowMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {createWorkflowMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="workflows" className="w-full">
        <TabsList className="bg-slate-800/50 border-slate-700 w-full sm:w-auto">
          <TabsTrigger value="workflows" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white">
            My Workflows
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white">
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6 mt-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              className={statusFilter === 'all' ? 'bg-blue-600' : 'border-slate-700 text-slate-300'}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('active')}
              className={statusFilter === 'active' ? 'bg-blue-600' : 'border-slate-700 text-slate-300'}
            >
              Active
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'paused' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('paused')}
              className={statusFilter === 'paused' ? 'bg-blue-600' : 'border-slate-700 text-slate-300'}
            >
              Paused
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'draft' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('draft')}
              className={statusFilter === 'draft' ? 'bg-blue-600' : 'border-slate-700 text-slate-300'}
            >
              Draft
            </Button>
          </div>

          {/* Workflows Grid */}
          {filteredWorkflows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {filteredWorkflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onEdit={() => navigate(createPageUrl('WorkflowBuilder') + `?id=${workflow.id}`)}
                  onToggleStatus={() => handleToggleStatus(workflow)}
                  onDelete={() => deleteWorkflowMutation.mutate(workflow.id)}
                  onRun={() => runWorkflowMutation.mutate(workflow)}
                  onDuplicate={() => handleDuplicate(workflow)}
                />
              ))}
            </div>
          ) : (
            <div className="glassmorphism-light border-slate-800/50 rounded-lg p-12 text-center">
              <GitBranch className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No automations yet</h3>
              <p className="text-slate-400 mb-6">Start from a template or create a new workflow</p>
              <div className="flex items-center justify-center space-x-3">
                <Button
                  onClick={() => document.querySelector('[value="templates"]').click()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Browse Templates
                </Button>
                <Button
                  onClick={handleCreateWorkflow}
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Workflow
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6 mt-6">
          <p className="text-slate-400 text-sm">
            Templates are ready-made workflows that you can customize after adding them to your workspace.
          </p>

          {isLoadingTemplates ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          ) : workflowTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {workflowTemplates.map((template) => (
                <Card key={template.id} className="glassmorphism-light border-slate-800/50 p-6 hover:border-blue-500/30 transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <GitBranch className="w-6 h-6 text-blue-400" />
                    </div>
                    <span className="text-slate-400 text-sm">{template.steps || template.nodes?.length || 0} steps</span>
                  </div>

                  <h3 className="text-white font-semibold text-lg mb-2">{template.name}</h3>
                  <p className="text-slate-400 text-sm mb-3">{template.description}</p>

                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-slate-500 text-xs mb-1">
                        Trigger: <span className="text-slate-400">{template.trigger_type || 'Manual'}</span>
                      </p>
                      <p className="text-slate-500 text-xs">
                        Outcome: <span className="text-slate-400">{template.outcome || 'Automated process completion'}</span>
                      </p>
                    </div>
                    {template.agents && template.agents.length > 0 && (
                      <div>
                        <p className="text-slate-500 text-xs mb-2">Agents involved:</p>
                        <div className="flex flex-wrap gap-2">
                          {template.agents.map((agent, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-300">
                              {agent}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {template.popularity && (
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Used {template.usage_count || 0} times</span>
                        <span>{template.popularity}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleUseTemplate(template)}
                    disabled={createWorkflowMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {createWorkflowMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Use Template
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-slate-500 text-center mt-2">
                    Creates a copy of this workflow in My Workflows
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <div className="glassmorphism-light border-slate-800/50 rounded-lg p-12 text-center">
              <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No templates available</h3>
              <p className="text-slate-400 mb-6">Workflow templates will appear here once created</p>
              <Button
                onClick={handleCreateWorkflow}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Workflow
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
