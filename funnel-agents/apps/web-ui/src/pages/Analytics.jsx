import { useState } from 'react';
import client from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Download, Calendar, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PerformanceChart from '../components/analytics/PerformanceChart';
import AgentLeaderboard from '../components/analytics/AgentLeaderboard';
import DomainComparisonChart from '../components/analytics/DomainComparisonChart';
import MetricCard from '../components/dashboard/MetricCard';
import { TrendingUp, CheckCircle2, Clock } from 'lucide-react';

export default function Analytics() {
  const [dateRange, setDateRange] = useState('7d');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState('all');

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => client.entities.agents.list(),
    initialData: [],
  });

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => client.get('/workspaces').catch(() => []),
    initialData: [],
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => client.entities.tasks.list({ sort: '-created_date', limit: 1000 }),
    initialData: [],
  });

  // Filter tasks based on selections
  const filteredTasks = tasks.filter(task => {
    if (selectedClient !== 'all' && task.workspace_id !== selectedClient) return false;
    if (selectedAgent !== 'all' && task.agent_id !== selectedAgent) return false;
    if (selectedDomain !== 'all') {
      const agent = agents.find(a => a.id === task.agent_id);
      if (agent?.domain !== selectedDomain) return false;
    }
    return true;
  });

  // Calculate metrics
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
  const failedTasks = filteredTasks.filter(t => t.status === 'failed').length;
  const avgCompletionTime = filteredTasks
    .filter(t => t.duration)
    .reduce((sum, t) => sum + t.duration, 0) / (filteredTasks.filter(t => t.duration).length || 1);
  
  const successRate = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  const domains = ['Offer', 'Marketing', 'Sales', 'Fulfillment', 'Feedback Loop', 'Operations', 'Customer Support', 'Leadership', 'Innovation', 'Enablement'];

  const handleExport = async (format) => {
    try {
      toast.info(`Generating ${format.toUpperCase()} export...`);

      const queryParams = new URLSearchParams({
        date_range: dateRange,
        client_id: selectedClient !== 'all' ? selectedClient : '',
        domain: selectedDomain !== 'all' ? selectedDomain : '',
        agent_id: selectedAgent !== 'all' ? selectedAgent : '',
      });

      const response = await fetch(`${client.baseURL || 'http://localhost:3000'}/analytics/export/${format}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${client.getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extension = format === 'excel' ? 'xlsx' : format;
      link.download = `analytics-export-${format}-${new Date().toISOString().split('T')[0]}.${extension}`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Analytics exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error(`${format.toUpperCase()} export error:`, error);
      toast.error(`Failed to export ${format.toUpperCase()}: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Reports</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Deep dive into performance metrics and insights</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
          {/* Date Range Selector */}
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-40 bg-slate-800/50 border-slate-700 text-white">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="7d" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                Last 7 Days
              </SelectItem>
              <SelectItem value="30d" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                Last 30 Days
              </SelectItem>
              <SelectItem value="90d" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                Last 90 Days
              </SelectItem>
              <SelectItem value="custom" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                Custom Range
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Export Buttons */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => handleExport('pdf')}
                  className="border-slate-700 text-white hover:bg-slate-800/50 w-full sm:w-auto"
                >
                  <Download className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Export PDF</span>
                  <span className="sm:hidden">PDF</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200">
                Export this report layout as PDF
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => handleExport('csv')}
                  className="border-slate-700 text-white hover:bg-slate-800/50 w-full sm:w-auto"
                >
                  <Download className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">CSV</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200">
                Download raw task and performance data
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-full sm:w-48" style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)'
          }}>
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent style={{ 
            backgroundColor: 'var(--bg-surface)', 
            border: '1px solid var(--border-medium)'
          }}>
            <SelectItem value="all" className="focus:bg-[var(--bg-surface-hover)]" style={{ color: 'var(--text-secondary)' }}>
              All Clients
            </SelectItem>
            {workspaces.map(ws => (
              <SelectItem key={ws.id} value={ws.id} className="focus:bg-[var(--bg-surface-hover)]" style={{ color: 'var(--text-secondary)' }}>
                {ws.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedDomain} onValueChange={setSelectedDomain}>
          <SelectTrigger className="w-full sm:w-48" style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)'
          }}>
            <SelectValue placeholder="All domains" />
          </SelectTrigger>
          <SelectContent style={{ 
            backgroundColor: 'var(--bg-surface)', 
            border: '1px solid var(--border-medium)'
          }}>
            <SelectItem value="all" className="focus:bg-[var(--bg-surface-hover)]" style={{ color: 'var(--text-secondary)' }}>
              All Domains
            </SelectItem>
            {domains.map(domain => (
              <SelectItem key={domain} value={domain} className="focus:bg-[var(--bg-surface-hover)]" style={{ color: 'var(--text-secondary)' }}>
                {domain}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedAgent} onValueChange={setSelectedAgent}>
          <SelectTrigger className="w-full sm:w-48" style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)'
          }}>
            <SelectValue placeholder="All agents" />
          </SelectTrigger>
          <SelectContent style={{ 
            backgroundColor: 'var(--bg-surface)', 
            border: '1px solid var(--border-medium)'
          }}>
            <SelectItem value="all" className="focus:bg-[var(--bg-surface-hover)]" style={{ color: 'var(--text-secondary)' }}>
              All Agents
            </SelectItem>
            {agents.map(agent => (
              <SelectItem key={agent.id} value={agent.id} className="focus:bg-[var(--bg-surface-hover)]" style={{ color: 'var(--text-secondary)' }}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <TooltipProvider>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          <div className="relative">
            <MetricCard
              title="Total Tasks"
              value={totalTasks}
              icon={TrendingUp}
              trend="up"
              trendValue="+15%"
              delay={0}
              description="vs last week"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3 h-3 text-slate-600 absolute top-4 right-4 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200">
                Total tasks created in this period
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="relative">
            <MetricCard
              title="Completed"
              value={completedTasks}
              icon={CheckCircle2}
              trend="up"
              trendValue="+12%"
              delay={0.1}
              description="vs last week"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3 h-3 text-slate-600 absolute top-4 right-4 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200">
                Tasks successfully completed
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="relative">
            <MetricCard
              title="Success Rate"
              value={`${successRate}%`}
              icon={TrendingUp}
              trend={successRate >= 90 ? 'up' : 'down'}
              trendValue={successRate >= 90 ? '+3%' : '-2%'}
              delay={0.2}
              description="vs last week"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3 h-3 text-slate-600 absolute top-4 right-4 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200">
                % of tasks completed without errors
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="relative">
            <MetricCard
              title="Avg Completion Time"
              value={`${Math.round(avgCompletionTime / 60)}m`}
              icon={Clock}
              trend="down"
              trendValue="-8%"
              delay={0.3}
              description="vs last week"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3 h-3 text-slate-600 absolute top-4 right-4 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200">
                Average time from task start to completion
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        <PerformanceChart 
          title="Task Volume Over Time"
          type="area"
          tasks={filteredTasks}
        />
        <PerformanceChart 
          title="Success Rate Over Time"
          type="line"
          tasks={filteredTasks}
          showPercentage
        />
      </div>

      {/* Top Performing Agents & Domain Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        <AgentLeaderboard agents={agents} tasks={filteredTasks} />
        <DomainComparisonChart agents={agents} tasks={filteredTasks} />
      </div>
    </div>
  );
}