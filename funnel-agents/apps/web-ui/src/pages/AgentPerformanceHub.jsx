import { useState } from 'react';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { TrendingUp, Activity, Award, AlertTriangle, BarChart3, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AgentPerformanceTable from '../components/performance-hub/AgentPerformanceTable';
import PerformanceFilters from '../components/performance-hub/PerformanceFilters';
import PerformanceTrends from '../components/performance-hub/PerformanceTrends';
import BatchActionsPanel from '../components/performance-hub/BatchActionsPanel';
import SkillGapAnalysis from '../components/performance-hub/SkillGapAnalysis';
import { toast } from 'sonner';

export default function AgentPerformanceHub() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [filters, setFilters] = useState({
    domain: 'all',
    status: 'all',
    performance: 'all',
    sortBy: 'success_rate',
    sortOrder: 'desc',
  });

  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => client.entities.Agent.list(),
    initialData: [],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks-all'],
    queryFn: () => client.entities.Task.list('-created_date', 500),
    initialData: [],
  });

  const { data: feedback = [], isLoading: feedbackLoading } = useQuery({
    queryKey: ['agent-feedback'],
    queryFn: () => client.entities.AgentFeedback.list('-created_date', 200),
    initialData: [],
  });

  const { data: tuningRecords = [], isLoading: tuningLoading } = useQuery({
    queryKey: ['tuning-records'],
    queryFn: () => client.entities.AgentPerformanceTuning.list('-created_date', 100),
    initialData: [],
  });

  const { data: clientFeedback = [] } = useQuery({
    queryKey: ['client-feedback'],
    queryFn: () => client.entities.ClientFeedback.list('-created_date', 200),
    initialData: [],
  });

  const updateAgentMutation = useMutation({
    mutationFn: ({ id, data }) => client.entities.Agent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent updated');
    },
  });

  // Calculate comprehensive performance metrics for each agent
  const enrichedAgents = agents.map(agent => {
    const agentTasks = tasks.filter(t => t.agent_id === agent.id);
    const agentFeedback = feedback.filter(f => f.agent_id === agent.id);
    const agentClientFeedback = clientFeedback.filter(f => f.related_id === agent.id);
    const agentTuning = tuningRecords.filter(t => t.agent_id === agent.id);

    const completedTasks = agentTasks.filter(t => t.status === 'completed').length;
    const failedTasks = agentTasks.filter(t => t.status === 'failed').length;
    const totalTasks = agentTasks.length;
    const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const avgFeedbackRating = agentFeedback.length > 0 
      ? agentFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / agentFeedback.length 
      : 0;

    const avgClientRating = agentClientFeedback.length > 0
      ? agentClientFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / agentClientFeedback.length
      : 0;

    const completedTasksWithTime = agentTasks.filter(t => t.status === 'completed' && t.duration);
    const avgCompletionTime = completedTasksWithTime.length > 0
      ? completedTasksWithTime.reduce((sum, t) => sum + t.duration, 0) / completedTasksWithTime.length
      : 0;

    const last30Days = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentTasks = agentTasks.filter(t => new Date(t.created_date).getTime() > last30Days);
    const recentSuccessRate = recentTasks.length > 0
      ? (recentTasks.filter(t => t.status === 'completed').length / recentTasks.length) * 100
      : 0;

    const performanceLevel = 
      successRate >= 90 && avgFeedbackRating >= 4 ? 'excellent' :
      successRate >= 75 && avgFeedbackRating >= 3.5 ? 'good' :
      successRate >= 60 ? 'average' : 'needs_improvement';

    return {
      ...agent,
      metrics: {
        totalTasks,
        completedTasks,
        failedTasks,
        successRate,
        avgFeedbackRating,
        avgClientRating,
        avgCompletionTime,
        recentTasks: recentTasks.length,
        recentSuccessRate,
        tuningCount: agentTuning.length,
        pendingTuning: agentTuning.filter(t => t.status === 'pending_review').length,
      },
      performanceLevel,
    };
  });

  // Apply filters
  const filteredAgents = enrichedAgents.filter(agent => {
    if (filters.domain !== 'all' && agent.domain !== filters.domain) return false;
    if (filters.status !== 'all' && agent.status !== filters.status) return false;
    if (filters.performance !== 'all' && agent.performanceLevel !== filters.performance) return false;
    return true;
  });

  // Apply sorting
  const sortedAgents = [...filteredAgents].sort((a, b) => {
    let aVal, bVal;
    
    switch (filters.sortBy) {
      case 'success_rate':
        aVal = a.metrics.successRate;
        bVal = b.metrics.successRate;
        break;
      case 'tasks':
        aVal = a.metrics.totalTasks;
        bVal = b.metrics.totalTasks;
        break;
      case 'feedback':
        aVal = a.metrics.avgFeedbackRating;
        bVal = b.metrics.avgFeedbackRating;
        break;
      case 'recent':
        aVal = a.metrics.recentSuccessRate;
        bVal = b.metrics.recentSuccessRate;
        break;
      default:
        aVal = a.metrics.successRate;
        bVal = b.metrics.successRate;
    }

    return filters.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  // Calculate summary stats
  const summaryStats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    excellent: enrichedAgents.filter(a => a.performanceLevel === 'excellent').length,
    needsImprovement: enrichedAgents.filter(a => a.performanceLevel === 'needs_improvement').length,
    avgSuccessRate: enrichedAgents.length > 0 
      ? enrichedAgents.reduce((sum, a) => sum + a.metrics.successRate, 0) / enrichedAgents.length 
      : 0,
    avgFeedback: enrichedAgents.length > 0
      ? enrichedAgents.reduce((sum, a) => sum + a.metrics.avgFeedbackRating, 0) / enrichedAgents.length
      : 0,
  };

  const isLoading = agentsLoading || tasksLoading || feedbackLoading || tuningLoading;

  const handleBatchAction = (action, agentIds) => {
    agentIds.forEach(id => {
      const agent = agents.find(a => a.id === id);
      if (agent) {
        if (action === 'activate') {
          updateAgentMutation.mutate({ id, data: { ...agent, status: 'active' } });
        } else if (action === 'deactivate') {
          updateAgentMutation.mutate({ id, data: { ...agent, status: 'inactive' } });
        }
      }
    });
    setSelectedAgents([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Agent Performance Hub
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Comprehensive performance analytics for all agents
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Agents</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{summaryStats.total}</p>
        </Card>

        <Card className="p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Active</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{summaryStats.active}</p>
        </Card>

        <Card className="p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center space-x-2 mb-2">
            <Award className="w-4 h-4 text-yellow-400" />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Excellent</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{summaryStats.excellent}</p>
        </Card>

        <Card className="p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Needs Work</span>
          </div>
          <p className="text-2xl font-bold text-orange-400">{summaryStats.needsImprovement}</p>
        </Card>

        <Card className="p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Success</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">{summaryStats.avgSuccessRate.toFixed(1)}%</p>
        </Card>

        <Card className="p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center space-x-2 mb-2">
            <Award className="w-4 h-4 text-blue-400" />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Rating</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{summaryStats.avgFeedback.toFixed(1)}/5</p>
        </Card>
      </div>

      {/* Filters */}
      <PerformanceFilters filters={filters} onFilterChange={setFilters} />

      {/* Batch Actions */}
      {selectedAgents.length > 0 && (
        <BatchActionsPanel
          selectedCount={selectedAgents.length}
          onBatchAction={(action) => handleBatchAction(action, selectedAgents)}
          onClearSelection={() => setSelectedAgents([])}
        />
      )}

      {/* Quick Actions */}
      <Card className="p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
              AI-Powered Agent Tuning
            </h4>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Optimize underperforming agents with AI recommendations
            </p>
          </div>
          <Button
            onClick={() => navigate(createPageUrl('AgentTuningWorkflow'))}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Start Tuning Workflow
          </Button>
        </div>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="table" className="space-y-4">
        <TabsList className="bg-slate-800/50 border-slate-700">
          <TabsTrigger value="table" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white">
            Performance Table
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white">
            Trends & Analytics
          </TabsTrigger>
          <TabsTrigger value="skills" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white">
            Skill Gap Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <AgentPerformanceTable
            agents={sortedAgents}
            isLoading={isLoading}
            selectedAgents={selectedAgents}
            onSelectAgent={(id) => {
              setSelectedAgents(prev => 
                prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
              );
            }}
            onSelectAll={(selectAll) => {
              setSelectedAgents(selectAll ? sortedAgents.map(a => a.id) : []);
            }}
          />
        </TabsContent>

        <TabsContent value="trends">
          <PerformanceTrends
            agents={enrichedAgents}
            tasks={tasks}
            feedback={feedback}
          />
        </TabsContent>

        <TabsContent value="skills">
          <SkillGapAnalysis
            agents={enrichedAgents}
            tasks={tasks}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}