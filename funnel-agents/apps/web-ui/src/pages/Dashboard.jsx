import client from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Users, CheckSquare, TrendingUp, Target, GitBranch, FolderKanban } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import MetricCard from '../components/dashboard/MetricCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import DomainHealthCard from '../components/dashboard/DomainHealthCard';
import TaskTrendsChart from '../components/dashboard/TaskTrendsChart';
import DomainDistributionChart from '../components/dashboard/DomainDistributionChart';
import AIProactiveInsights from '../components/dashboard/AIProactiveInsights';

export default function Dashboard() {
  const navigate = useNavigate();
  
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => client.entities.Agent.list(),
    initialData: [],
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => client.entities.Task.list('-created_date', 100),
    initialData: [],
  });

  const activeAgents = agents.filter(a => a.status === 'active').length;
  const runningTasks = tasks.filter(t => t.status === 'running').length;
  const completedToday = tasks.filter(t => {
    if (!t.completed_at) return false;
    const today = new Date().toDateString();
    return new Date(t.completed_at).toDateString() === today;
  }).length;
  
  const totalCompleted = tasks.filter(t => t.status === 'completed').length;
  const totalFailed = tasks.filter(t => t.status === 'failed').length;
  const successRate = totalCompleted + totalFailed > 0 
    ? Math.round((totalCompleted / (totalCompleted + totalFailed)) * 100)
    : 0;

  // Domain health data - ordered by marketing lifecycle
  const domains = [
    'Offer', 'Marketing', 'Sales', 'Fulfillment', 'Feedback Loop',
    'Operations', 'Customer Support', 'Leadership', 'Innovation', 'Enablement'
  ];

  const domainData = domains.map(domain => {
    const domainAgents = agents.filter(a => a.domain === domain);
    const activeCount = domainAgents.filter(a => a.status === 'active').length;
    const avgSuccess = domainAgents.length > 0
      ? Math.round(domainAgents.reduce((sum, a) => sum + (a.success_rate || 0), 0) / domainAgents.length)
      : 0;
    
    return {
      domain,
      agentCount: domainAgents.length,
      activeCount,
      successRate: avgSuccess,
    };
  }); // Ordered by marketing lifecycle, not sorted by success rate

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Here's what's happening in your agency today.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link to={createPageUrl('Agents')}>
            <Button variant="outline" style={{ 
              border: '1px solid var(--border-medium)', 
              color: 'var(--text-primary)' 
            }} className="hover:bg-[var(--bg-surface-hover)]">
              <Users className="w-4 h-4 mr-2" />
              View Agents
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="text-white" style={{ backgroundColor: 'var(--accent)' }}>
                <Plus className="w-4 h-4 mr-2" />
                New Work
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72" style={{ 
              backgroundColor: 'var(--bg-surface)', 
              border: '1px solid var(--border-medium)' 
            }}>
              <DropdownMenuItem 
                onClick={() => navigate(createPageUrl('Tasks'))}
                className="focus:bg-[var(--bg-surface-hover)] cursor-pointer p-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                <div className="flex items-start space-x-3">
                  <CheckSquare className="w-4 h-4 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Create Task</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Run an agent once for a specific brief</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate(createPageUrl('Projects'))}
                className="focus:bg-[var(--bg-surface-hover)] cursor-pointer p-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                <div className="flex items-start space-x-3">
                  <FolderKanban className="w-4 h-4 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Create Campaign</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Group tasks around a marketing initiative</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate(createPageUrl('Workflows'))}
                className="focus:bg-[var(--bg-surface-hover)] cursor-pointer p-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                <div className="flex items-start space-x-3">
                  <GitBranch className="w-4 h-4 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>New Automation</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Set up recurring or triggered work</p>
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 md:gap-6">
        <MetricCard
          title="Active Agents"
          value={activeAgents}
          icon={Users}
          trend={activeAgents > 0 ? "up" : undefined}
          trendValue={activeAgents > 0 ? "+12%" : undefined}
          delay={0}
          onClick={() => navigate(createPageUrl('Agents') + '?status=active')}
          emptyMessage="No active agents yet"
        />
        <MetricCard
          title="Tasks Running"
          value={runningTasks}
          icon={CheckSquare}
          delay={0.1}
          onClick={() => navigate(createPageUrl('Tasks') + '?status=running')}
          emptyMessage="No tasks running"
        />
        <MetricCard
          title="Completed Today"
          value={completedToday}
          icon={TrendingUp}
          trend={completedToday > 0 ? "up" : undefined}
          trendValue={completedToday > 0 ? "+8%" : undefined}
          delay={0.2}
          onClick={() => navigate(createPageUrl('Tasks') + '?completed=today')}
          emptyMessage="No work shipped yet today"
        />
        <MetricCard
          title="Success Rate"
          value={totalCompleted + totalFailed > 0 ? `${successRate}%` : 0}
          icon={Target}
          trend={successRate >= 90 ? 'up' : successRate > 0 ? 'down' : undefined}
          trendValue={successRate >= 90 ? '+2%' : successRate > 0 ? '-3%' : undefined}
          delay={0.3}
          emptyMessage="No reviews yet"
        />
        <MetricCard
          title="New Leads This Week"
          value="142"
          icon={Users}
          trend="up"
          trendValue="+18%"
          delay={0.4}
          onClick={() => navigate(createPageUrl('Leads'))}
        />
      </div>

      {/* AI Insights */}
      <AIProactiveInsights />

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <div className="xl:col-span-2">
          <TaskTrendsChart title="Work Shipped (Last 7 Days)" />
        </div>
        <div className="xl:col-span-1">
          <ActivityFeed title="Real-Time Activity Feed" />
        </div>
      </div>

      {/* Domain Health Overview */}
      <div>
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Domain Health Overview</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Performance across all 10 business domains</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {domainData.map((domain, index) => (
            <DomainHealthCard
              key={domain.domain}
              {...domain}
              delay={index * 0.05}
              onClick={() => navigate(createPageUrl('Agents') + `?domain=${domain.domain}`)}
            />
          ))}
        </div>
      </div>

      {/* Domain Distribution Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        <DomainDistributionChart />
        <Card className="p-6 h-full flex flex-col" style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px'
        }}>
          <h3 className="font-semibold text-lg mb-6" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
          <div className="flex flex-col gap-3 flex-1">
            <Link to={createPageUrl('Tasks')}>
              <div className="p-4 rounded-xl hover:shadow-lg transition-all cursor-pointer group" style={{ 
                backgroundColor: 'var(--bg-surface)', 
                border: '1px solid var(--border-subtle)' 
              }}>
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                    <Plus className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Run an agent for a client</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Execute an agent once for a specific brief</p>
                  </div>
                </div>
              </div>
            </Link>
            <Link to={createPageUrl('AgentTemplates')}>
              <div className="p-4 rounded-xl hover:shadow-lg transition-all cursor-pointer group" style={{ 
                backgroundColor: 'var(--bg-surface)', 
                border: '1px solid var(--border-subtle)' 
              }}>
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                    <Users className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Add a new agent from template</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Browse ready-made agent templates</p>
                  </div>
                </div>
              </div>
            </Link>
            <Link to={createPageUrl('Tasks') + '?status=failed'}>
              <div className="p-4 rounded-xl hover:shadow-lg transition-all cursor-pointer group" style={{ 
                backgroundColor: 'var(--bg-surface)', 
                border: '1px solid var(--border-subtle)' 
              }}>
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Review problem tasks</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Check failed or low-quality work</p>
                  </div>
                </div>
              </div>
            </Link>
            <Link to={createPageUrl('Workflows')}>
              <div className="p-4 rounded-xl hover:shadow-lg transition-all cursor-pointer group" style={{ 
                backgroundColor: 'var(--bg-surface)', 
                border: '1px solid var(--border-subtle)' 
              }}>
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                    <Target className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Build workflow</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Schedule and chain agents</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}