import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Play, Save, Settings, Zap } from 'lucide-react';
import { createPageUrl } from '@/utils';
import WorkflowCanvas from '@/components/workflows/WorkflowCanvas';
import AIWorkflowTemplates from '@/components/workflows/AIWorkflowTemplates';
import WorkflowPerformanceMonitor from '@/components/workflows/WorkflowPerformanceMonitor';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function WorkflowEditor() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const workflowId = new URLSearchParams(location.search).get('id');

  const [editingName, setEditingName] = useState(false);
  const [localWorkflow, setLocalWorkflow] = useState(null);
  const [showAITemplates, setShowAITemplates] = useState(false);

  const { data: workflow, isLoading } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: async () => {
      const wf = await client.get(`/api/automations/workflows/${workflowId}`);
      setLocalWorkflow(wf);
      return wf;
    },
    enabled: !!workflowId,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      try {
        return await client.get('/api/campaigns') || [];
      } catch (err) {
        console.error('Failed to fetch campaigns:', err);
        return [];
      }
    },
    initialData: [],
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        return await client.get('/api/tasks?limit=200&sort=-created_date') || [];
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        return [];
      }
    },
    initialData: [],
  });

  const { data: workflowRuns = [] } = useQuery({
    queryKey: ['workflow-runs', workflowId],
    queryFn: async () => {
      try {
        return await client.get(`/api/automations/workflow-runs?workflow_id=${workflowId}&sort=-created_date`) || [];
      } catch (err) {
        console.error('Failed to fetch workflow runs:', err);
        return [];
      }
    },
    enabled: !!workflowId,
    initialData: [],
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: (data) => client.patch(`/api/automations/workflows/${workflowId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow', workflowId] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow saved');
    },
  });

  const handleSave = () => {
    if (localWorkflow) {
      updateWorkflowMutation.mutate(localWorkflow);
    }
  };

  const handleUpdateWorkflow = (updates) => {
    setLocalWorkflow(prev => ({ ...prev, ...updates }));
  };

  const handleApplyTemplate = (template) => {
    // Convert template steps to workflow nodes
    const nodes = template.steps.map((step, index) => ({
      id: `node-${Date.now()}-${index}`,
      type: step.type,
      config: {
        name: step.action,
        description: step.action,
      },
      position: { x: 150 + (index % 3) * 250, y: 100 + Math.floor(index / 3) * 150 },
    }));

    // Create sequential connections
    const connections = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      connections.push({
        id: `conn-${Date.now()}-${i}`,
        from: nodes[i].id,
        to: nodes[i + 1].id,
      });
    }

    handleUpdateWorkflow({
      name: template.name,
      description: template.description,
      nodes,
      connections,
    });

    setShowAITemplates(false);
    toast.success('Template applied! Customize the nodes as needed.');
  };

  const handleTestRun = async () => {
    if (!localWorkflow?.nodes || localWorkflow.nodes.length === 0) {
      toast.error('Add at least one node to run the workflow');
      return;
    }

    toast.loading('Executing workflow...', { id: 'workflow-run' });

    try {
      // Execute the workflow via API
      await client.post(`/api/automations/workflows/${workflowId}/execute`, {
        trigger_type: 'manual',
        trigger_data: {},
      });

      toast.success('Workflow execution started!', { id: 'workflow-run' });
      queryClient.invalidateQueries({ queryKey: ['workflow', workflowId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-runs', workflowId] });
    } catch (error) {
      toast.error('Workflow execution failed', { id: 'workflow-run' });
      console.error(error);
    }
  };

  if (isLoading || !workflow || !localWorkflow) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('Workflows'))}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            {editingName ? (
              <Input
                value={localWorkflow.name}
                onChange={(e) => handleUpdateWorkflow({ name: e.target.value })}
                onBlur={() => setEditingName(false)}
                autoFocus
                className="text-2xl font-bold bg-transparent border-slate-700"
                style={{ color: 'var(--text-primary)' }}
              />
            ) : (
              <h1
                className="text-3xl font-bold cursor-pointer hover:text-blue-400"
                style={{ color: 'var(--text-primary)' }}
                onClick={() => setEditingName(true)}
              >
                {localWorkflow.name}
              </h1>
            )}
            <p className="text-slate-400 text-sm mt-1">
              {localWorkflow.nodes?.length || 0} nodes • Last saved {new Date(localWorkflow.updated_date).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <Select
            value={localWorkflow.status}
            onValueChange={(v) => {
              if (v === 'active' && (!localWorkflow.nodes || localWorkflow.nodes.length === 0)) {
                toast.error('Add at least one node before activating');
                return;
              }
              if (v === 'active' && !localWorkflow.trigger_type) {
                toast.error('Set a trigger type before activating');
                return;
              }
              handleUpdateWorkflow({ status: v });
            }}
          >
            <SelectTrigger className="w-32 bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="draft" className="text-slate-300 focus:bg-slate-700 focus:text-white">Draft</SelectItem>
              <SelectItem value="active" className="text-slate-300 focus:bg-slate-700 focus:text-white">Active</SelectItem>
              <SelectItem value="paused" className="text-slate-300 focus:bg-slate-700 focus:text-white">Paused</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleTestRun} variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
            <Play className="w-4 h-4 mr-2" />
            Test Run
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* AI Templates Toggle */}
      {(!localWorkflow.nodes || localWorkflow.nodes.length === 0) && (
        <div className="flex justify-center">
          <Button
            onClick={() => setShowAITemplates(!showAITemplates)}
            variant="outline"
            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
          >
            <Zap className="w-4 h-4 mr-2" />
            {showAITemplates ? 'Hide' : 'Get'} AI Template Suggestions
          </Button>
        </div>
      )}

      {/* AI Workflow Templates */}
      {showAITemplates && (
        <AIWorkflowTemplates
          onSelectTemplate={handleApplyTemplate}
          campaigns={campaigns}
          tasks={tasks}
        />
      )}

      {/* Progress Steps */}
      <div className="glassmorphism-light border-slate-800/50 rounded-lg p-4 overflow-x-auto">
        <div className="flex items-center gap-4 md:gap-8 text-sm whitespace-nowrap">
          <div className="flex items-center space-x-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${localWorkflow.description ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
              1
            </span>
            <span className="text-slate-300">Describe the automation</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${localWorkflow.nodes?.length > 0 ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
              2
            </span>
            <span className="text-slate-300">Add steps</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${localWorkflow.trigger_type && localWorkflow.trigger_type !== 'manual' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
              3
            </span>
            <span className="text-slate-300">Set trigger</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <Textarea
          placeholder="Describe what this automation does..."
          value={localWorkflow.description || ''}
          onChange={(e) => handleUpdateWorkflow({ description: e.target.value })}
          className={`bg-slate-800/50 border-slate-700 text-white ${!localWorkflow.description ? 'border-blue-500/30' : ''}`}
        />
      </div>

      {/* Canvas */}
      <WorkflowCanvas
        workflow={localWorkflow}
        onUpdateWorkflow={handleUpdateWorkflow}
      />

      {/* Performance Monitor */}
      {workflowRuns.length > 0 && (
        <WorkflowPerformanceMonitor
          workflow={localWorkflow}
          workflowRuns={workflowRuns}
        />
      )}

      {/* Trigger Settings - Prominent Position */}
      <div className="glassmorphism-light border-slate-800/50 rounded-lg p-4 md:p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Trigger Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">When should this workflow run?</label>
            <Select
              value={localWorkflow.trigger_type || 'manual'}
              onValueChange={(v) => handleUpdateWorkflow({ trigger_type: v })}
            >
              <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="manual" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                  Manual (Run when you click)
                </SelectItem>
                <SelectItem value="schedule" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                  Scheduled (Daily / Weekly / Monthly)
                </SelectItem>
                <SelectItem value="event" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                  On new task for client
                </SelectItem>
                <SelectItem value="webhook" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                  Webhook (Advanced)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {localWorkflow.trigger_type === 'schedule' && (
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Schedule (Cron)</label>
              <Input
                placeholder="0 9 * * *"
                value={localWorkflow.trigger_config?.cron || ''}
                onChange={(e) => handleUpdateWorkflow({
                  trigger_config: { ...localWorkflow.trigger_config, cron: e.target.value }
                })}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">Example: 0 9 * * * (daily at 9am)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}