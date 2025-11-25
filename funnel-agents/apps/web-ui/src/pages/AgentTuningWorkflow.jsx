import { useState } from 'react';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, ArrowLeft, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AgentSelector from '@/components/tuning-workflow/AgentSelector';
import MetricsSelector from '@/components/tuning-workflow/MetricsSelector';
import AITuningSuggestions from '@/components/tuning-workflow/AITuningSuggestions';
import TuningHistory from '@/components/tuning-workflow/TuningHistory';
import { toast } from 'sonner';

export default function AgentTuningWorkflow() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [targetMetrics, setTargetMetrics] = useState({
    success_rate: false,
    feedback_score: false,
    completion_time: false,
    output_quality: false,
  });
  const [suggestions, setSuggestions] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => client.entities.Agent.list(),
    initialData: [],
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-all'],
    queryFn: () => client.entities.Task.list('-created_date', 300),
    initialData: [],
  });

  const { data: feedback = [] } = useQuery({
    queryKey: ['agent-feedback'],
    queryFn: () => client.entities.AgentFeedback.list('-created_date', 200),
    initialData: [],
  });

  const { data: tuningHistory = [] } = useQuery({
    queryKey: ['tuning-history'],
    queryFn: () => client.entities.AgentPerformanceTuning.list('-created_date'),
    initialData: [],
  });

  const generateSuggestionsMutation = useMutation({
    mutationFn: async ({ agentIds, metrics }) => {
      const response = await client.functions.invoke('generateAgentTuning', {
        agent_ids: agentIds,
        target_metrics: metrics,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setSuggestions(data);
      toast.success('AI tuning suggestions generated');
    },
    onError: () => {
      toast.error('Failed to generate suggestions');
    },
  });

  const applyTuningMutation = useMutation({
    mutationFn: async ({ agentId, changes, recommendations }) => {
      // Save current config as history
      const agent = agents.find(a => a.id === agentId);
      await client.entities.AgentPerformanceTuning.create({
        agent_id: agentId,
        agent_name: agent.name,
        trigger_type: 'manual',
        trigger_id: 'tuning_workflow',
        analysis: {
          identified_issues: recommendations.identified_issues || [],
          improvement_areas: recommendations.improvement_areas || [],
        },
        recommendations: recommendations.recommendations || [],
        applied_changes: changes.map(change => ({
          parameter: change.parameter,
          old_value: String(agent[change.parameter] || 'N/A'),
          new_value: String(change.new_value),
          applied_at: new Date().toISOString(),
          applied_by: 'AI Tuning Workflow',
        })),
        status: 'applied',
        auto_applied: false,
        performance_before: {
          avg_rating: agent.metrics?.avgFeedbackRating || 0,
          success_rate: agent.metrics?.successRate || 0,
        },
      });

      // Apply changes to agent
      const updates = {};
      changes.forEach(change => {
        if (change.parameter.includes('.')) {
          const [parent, child] = change.parameter.split('.');
          updates[parent] = { ...(agent[parent] || {}), [child]: change.new_value };
        } else {
          updates[change.parameter] = change.new_value;
        }
      });

      return client.entities.Agent.update(agentId, { ...agent, ...updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['tuning-history'] });
      toast.success('Tuning applied successfully');
    },
  });

  const handleGenerateSuggestions = () => {
    if (selectedAgents.length === 0) {
      toast.error('Please select at least one agent');
      return;
    }
    const activeMetrics = Object.keys(targetMetrics).filter(k => targetMetrics[k]);
    if (activeMetrics.length === 0) {
      toast.error('Please select at least one metric to improve');
      return;
    }

    setIsGenerating(true);
    generateSuggestionsMutation.mutate(
      { agentIds: selectedAgents, metrics: activeMetrics },
      { onSettled: () => setIsGenerating(false) }
    );
  };

  const handleApplyTuning = (agentId, changes, recommendations) => {
    applyTuningMutation.mutate({ agentId, changes, recommendations });
  };

  const handleRollback = async (tuningRecord) => {
    const agent = agents.find(a => a.id === tuningRecord.agent_id);
    if (!agent) return;

    const rollbackChanges = tuningRecord.applied_changes.map(change => ({
      parameter: change.parameter,
      old_value: change.new_value,
      new_value: change.old_value,
    }));

    const updates = {};
    rollbackChanges.forEach(change => {
      if (change.parameter.includes('.')) {
        const [parent, child] = change.parameter.split('.');
        updates[parent] = { ...(agent[parent] || {}), [child]: change.new_value };
      } else {
        updates[change.parameter] = change.new_value;
      }
    });

    await client.entities.Agent.update(tuningRecord.agent_id, { ...agent, ...updates });
    await client.entities.AgentPerformanceTuning.create({
      agent_id: tuningRecord.agent_id,
      agent_name: tuningRecord.agent_name,
      trigger_type: 'rollback',
      trigger_id: tuningRecord.id,
      analysis: { identified_issues: ['Rollback to previous configuration'] },
      recommendations: [],
      applied_changes: rollbackChanges,
      status: 'applied',
      auto_applied: false,
    });

    queryClient.invalidateQueries({ queryKey: ['agents'] });
    queryClient.invalidateQueries({ queryKey: ['tuning-history'] });
    toast.success('Rolled back to previous configuration');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('AgentPerformanceHub'))}
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              AI Agent Tuning Workflow
            </h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
              Optimize agent performance with AI-powered recommendations
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="tuning" className="space-y-6">
        <TabsList className="bg-slate-800/50 border-slate-700">
          <TabsTrigger value="tuning" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white">
            <Sparkles className="w-4 h-4 mr-2" />
            Tune Agents
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white">
            <History className="w-4 h-4 mr-2" />
            History & Rollback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tuning" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AgentSelector
              agents={agents}
              selectedAgents={selectedAgents}
              onSelectAgents={setSelectedAgents}
              tasks={tasks}
              feedback={feedback}
            />
            <MetricsSelector
              targetMetrics={targetMetrics}
              onMetricsChange={setTargetMetrics}
            />
          </div>

          <Card className="p-6 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <Button
              onClick={handleGenerateSuggestions}
              disabled={isGenerating || selectedAgents.length === 0}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {isGenerating ? 'Analyzing...' : 'Generate AI Tuning Suggestions'}
            </Button>
            {selectedAgents.length === 0 && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Select at least one agent to continue
              </p>
            )}
          </Card>

          {suggestions && (
            <AITuningSuggestions
              suggestions={suggestions}
              agents={agents}
              onApplyTuning={handleApplyTuning}
              isApplying={applyTuningMutation.isPending}
            />
          )}
        </TabsContent>

        <TabsContent value="history">
          <TuningHistory
            tuningHistory={tuningHistory}
            agents={agents}
            onRollback={handleRollback}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}