import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Play, Save } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import WorkflowCanvas from '@/components/workflow-builder/WorkflowCanvas';
import TriggerConfig from '@/components/workflow-builder/TriggerConfig';
import WorkflowExecutionHistory from '@/components/workflow-builder/WorkflowExecutionHistory';
import AIWorkflowOptimizer from '@/components/workflow-builder/AIWorkflowOptimizer';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function WorkflowBuilder() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const workflowId = new URLSearchParams(location.search).get('id');
  
  const [workflowData, setWorkflowData] = useState({
    name: '',
    description: '',
    status: 'draft',
    nodes: [],
    edges: [],
    trigger: { type: 'manual', config: {}, conditions: [] },
    variables: {}
  });

  const [performanceData, setPerformanceData] = useState(null);

  const { data: workflow, isLoading } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: async () => {
      const found = await client.get(`/api/automations/workflows/${workflowId}`);
      if (found) setWorkflowData(found);
      return found;
    },
    enabled: !!workflowId,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      try {
        return await client.get('/api/agents') || [];
      } catch (err) {
        console.error('Failed to fetch agents:', err);
        return [];
      }
    },
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (workflowId) {
        return client.patch(`/api/automations/workflows/${workflowId}`, data);
      } else {
        return client.post('/api/automations/workflows', data);
      }
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow saved');
      if (!workflowId) {
        navigate(createPageUrl('WorkflowBuilder') + `?id=${saved.id}`);
      }
    },
  });

  const executeMutation = useMutation({
    mutationFn: async () => {
      const response = await client.post(`/api/automations/workflows/${workflowId || workflow?.id}/execute`, {
        trigger_type: 'manual',
        trigger_data: {}
      });
      return response;
    },
    onSuccess: () => {
      toast.success('Workflow execution started');
    },
  });

  const handleSave = () => {
    if (!workflowData.name) {
      toast.error('Please enter a workflow name');
      return;
    }
    saveMutation.mutate(workflowData);
  };

  const handleUpdateWorkflow = (updates) => {
    setWorkflowData(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('Workflows'))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <Input
              value={workflowData.name}
              onChange={(e) => setWorkflowData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Workflow Name"
              className="text-2xl font-bold border-0 p-0 h-auto bg-transparent"
              style={{ color: 'var(--text-primary)' }}
            />
            <Textarea
              value={workflowData.description}
              onChange={(e) => setWorkflowData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this workflow does..."
              className="mt-2 text-sm border-0 p-0 bg-transparent resize-none"
              style={{ color: 'var(--text-secondary)' }}
              rows={2}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button
            onClick={() => executeMutation.mutate()}
            disabled={!workflowId || executeMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-4 h-4 mr-2" />
            Test Run
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList className="bg-slate-800/50 border-slate-700">
          <TabsTrigger value="builder" className="data-[state=active]:bg-slate-700">
            Builder
          </TabsTrigger>
          <TabsTrigger value="trigger" className="data-[state=active]:bg-slate-700">
            Trigger
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-slate-700">
            History
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700">
            Settings
          </TabsTrigger>
          <TabsTrigger value="optimize" className="data-[state=active]:bg-slate-700">
            AI Optimize
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <WorkflowCanvas
            workflow={workflowData}
            onUpdateWorkflow={handleUpdateWorkflow}
            agents={agents}
            performanceData={performanceData}
          />
        </TabsContent>

        <TabsContent value="trigger">
          <TriggerConfig
            workflow={workflowData}
            onUpdateTrigger={(trigger) => handleUpdateWorkflow({ trigger })}
          />
        </TabsContent>

        <TabsContent value="history">
          {workflowId && <WorkflowExecutionHistory workflowId={workflowId} />}
        </TabsContent>

        <TabsContent value="settings">
          <Card className="p-6" style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-subtle)' 
          }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Workflow Settings
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-xs mb-2">Status</Label>
                <select
                  value={workflowData.status}
                  onChange={(e) => setWorkflowData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2 rounded border text-sm"
                  style={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="optimize">
          {workflowId && (
            <AIWorkflowOptimizer
              workflowId={workflowId}
              workflowName={workflowData.name}
              onAnalysisComplete={setPerformanceData}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}