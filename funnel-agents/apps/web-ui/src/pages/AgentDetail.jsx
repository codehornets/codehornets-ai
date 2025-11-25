import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Settings, GitBranch, TrendingUp, Clock, CheckCircle2, 
  Users, FolderKanban, AlertCircle, ExternalLink, MoreVertical,
  XCircle, Loader2, MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import RunAgentModal from '../components/agent-detail/RunAgentModal';
import AddToAutomationModal from '../components/agent-detail/AddToAutomationModal';
import EditSettingsSheet from '../components/agent-detail/EditSettingsSheet';
import FloatingAgentChat from '../components/agent-chat/FloatingAgentChat';
import TaskDetailModal from '../components/agent-detail/TaskDetailModal';
import AgentTrainingPanel from '../components/agent-training/AgentTrainingPanel';
import PerformanceDashboard from '../components/agent-training/PerformanceDashboard';
import AgentPerformanceTuning from '../components/agent-tuning/AgentPerformanceTuning';
import AgentSkillsManager from '../components/agents/AgentSkillsManager';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AgentDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const agentId = new URLSearchParams(location.search).get('id');
  const queryClient = useQueryClient();
  
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [automationModalOpen, setAutomationModalOpen] = useState(false);
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');
  const [showChat, setShowChat] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const agents = await client.entities.Agent.list();
      return agents.find(a => a.id === agentId);
    },
    enabled: !!agentId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['agent-tasks', agentId],
    queryFn: async () => {
      const allTasks = await client.entities.Task.list('-created_date', 50);
      return allTasks.filter(t => t.agent_id === agentId);
    },
    enabled: !!agentId,
    initialData: [],
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => client.entities.Project.list(),
    initialData: [],
  });

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => client.entities.Workspace.list(),
    initialData: [],
  });

  const updateAgentMutation = useMutation({
    mutationFn: (updates) => client.entities.Agent.update(agentId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent updated successfully');
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => client.entities.Task.create({
      title: `${agent.name}: ${taskData.brief.substring(0, 50)}...`,
      description: taskData.brief,
      agent_id: agent.id,
      agent_name: agent.name,
      status: 'running',
      task_type: taskData.task_type,
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
      const workspace = workspaces.find(w => w.id === data.workspace_id);
      const workspaceName = workspace?.name || 'Client';
      toast.success(`${agent.name} is working on ${workspaceName}. View task.`, {
        action: { label: 'View', onClick: () => {} }
      });
    },
  });

  const handleRunAgent = (formData) => {
    createTaskMutation.mutate(formData);
  };

  const handleAddToAutomation = (data) => {
    toast.success('Agent added to automation successfully');
  };

  const handleSaveSettings = (settings) => {
    queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };

  const handleViewCompletedTasks = () => {
    setActivityFilter('completed');
    document.querySelector('#recent-activity')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleViewWorkspace = (workspaceId) => {
    navigate(createPageUrl('Workspaces') + `?id=${workspaceId}`);
  };

  if (isLoading || !agent) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const approvalRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const avgCompletionTime = tasks
    .filter(t => t.duration)
    .reduce((sum, t) => sum + t.duration, 0) / (tasks.filter(t => t.duration).length || 1);
  const hoursSaved = Math.round((completedTasks * avgCompletionTime) / 3600);
  const runningTasks = tasks.filter(t => t.status === 'running').length;

  const filteredTasks = tasks.filter(task => {
    if (activityFilter === 'all') return true;
    if (activityFilter === 'completed') return task.status === 'completed';
    if (activityFilter === 'review') return task.status === 'pending';
    if (activityFilter === 'errors') return task.status === 'failed';
    return true;
  });

  const domainColors = {
    'Offer': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Marketing': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Sales': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Fulfillment': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Feedback Loop': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'Operations': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Customer Support': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'Leadership': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Innovation': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    'Enablement': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  };

  const domainGradients = {
    'Offer': 'from-slate-600 to-slate-700',
    'Marketing': 'from-indigo-600 to-indigo-700',
    'Sales': 'from-emerald-600 to-emerald-700',
    'Fulfillment': 'from-amber-600 to-amber-700',
    'Feedback Loop': 'from-orange-600 to-orange-700',
    'Operations': 'from-blue-600 to-blue-700',
    'Customer Support': 'from-cyan-600 to-cyan-700',
    'Leadership': 'from-purple-600 to-purple-700',
    'Innovation': 'from-violet-600 to-violet-700',
    'Enablement': 'from-teal-600 to-teal-700',
  };

  const getAgentPersona = (name) => {
    const personas = {
      'Market Researcher': { firstName: 'Sarah', lastName: 'Chen', title: 'Market Analyst', initials: 'SC' },
      'Content Creator': { firstName: 'Marcus', lastName: 'Rivera', title: 'Content Strategist', initials: 'MR' },
      'SEO Specialist': { firstName: 'Emily', lastName: 'Foster', title: 'SEO Expert', initials: 'EF' },
      'Lead Qualifier': { firstName: 'David', lastName: 'Kim', title: 'Lead Specialist', initials: 'DK' },
      'Email Marketer': { firstName: 'Jessica', lastName: 'Wells', title: 'Email Strategist', initials: 'JW' },
      'Social Media Manager': { firstName: 'Alex', lastName: 'Turner', title: 'Social Media Lead', initials: 'AT' },
      'Competitor Analyst': { firstName: 'Michael', lastName: 'Brooks', title: 'Competitive Intel', initials: 'MB' },
      'Value Proposition Creator': { firstName: 'Sophia', lastName: 'Martinez', title: 'Value Architect', initials: 'SM' },
      'Service Designer': { firstName: 'Oliver', lastName: 'Hayes', title: 'Service Designer', initials: 'OH' },
      'Pricing Strategist': { firstName: 'Rachel', lastName: 'Park', title: 'Pricing Analyst', initials: 'RP' },
      'Proposal Writer': { firstName: 'James', lastName: 'Anderson', title: 'Proposal Lead', initials: 'JA' },
      'Brand Designer': { firstName: 'Nina', lastName: 'Patel', title: 'Brand Specialist', initials: 'NP' },
      'Ads Manager': { firstName: 'Chris', lastName: 'Morgan', title: 'Ads Manager', initials: 'CM' },
    };
    
    return personas[name] || { firstName: 'Agent', lastName: 'AI', title: 'Specialist', initials: name?.substring(0, 2).toUpperCase() || 'AI' };
  };

  const persona = agent ? getAgentPersona(agent.name) : null;
  const gradient = agent ? (domainGradients[agent.domain] || 'from-slate-600 to-slate-700') : 'from-slate-600 to-slate-700';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-white font-semibold text-2xl">{persona?.initials}</span>
            </div>
            {agent.status === 'active' && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-3 border-slate-900 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white"></div>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{persona?.firstName} {persona?.lastName}</h1>
              <Badge className={domainColors[agent.domain] || 'bg-slate-500/20 text-slate-400'}>
                {agent.domain}
              </Badge>
            </div>
            <p className="text-base mb-1" style={{ color: 'var(--text-secondary)' }}>Your {agent.name} Agent</p>
            <p className="text-sm max-w-2xl" style={{ color: 'var(--text-muted)' }}>{agent.role}</p>
            
            {/* Skills */}
            {agent.skills && agent.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {agent.skills.slice(0, 5).map((skill, idx) => {
                  const skillName = typeof skill === 'string' ? skill : skill.name;
                  const skillLevel = typeof skill === 'object' ? skill.level : 'intermediate';
                  const levelColor = 
                    skillLevel === 'expert' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                    skillLevel === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                    'bg-blue-500/20 text-blue-400 border-blue-500/30';
                  
                  return (
                    <Badge
                      key={idx}
                      className={`${levelColor} text-xs`}
                    >
                      {skillName}
                    </Badge>
                  );
                })}
                {agent.skills.length > 5 && (
                  <Badge className="bg-slate-700/50 text-slate-400 text-xs">
                    +{agent.skills.length - 5} more
                  </Badge>
                )}
              </div>
            )}
            
            <div className="flex items-center space-x-4 mt-3">
              <p className="text-sm text-slate-500">
                {agent.tools_enabled?.length > 0 ? (
                  <>
                    <span className="text-blue-400">{agent.tools_enabled.length} tools enabled</span> •
                  </>
                ) : null}
                Used in <span
                  className="text-blue-400 hover:underline cursor-pointer"
                  onClick={() => navigate(createPageUrl('Workflows'))}
                >
                  3 automations
                </span>
              </p>
              {runningTasks > 0 && (
                <>
                  <span className="text-slate-600">•</span>
                  <div className="flex items-center space-x-2 text-sm text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Running {runningTasks} {runningTasks === 1 ? 'task' : 'tasks'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Warning if approval rate dropped */}
      {approvalRate < 75 && (
        <Card className="glassmorphism-light border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <div className="flex-1">
                <p className="text-amber-400 font-medium">Approval rate down 15% vs last month</p>
                <p className="text-sm text-amber-400/70 mt-1">Most declines came from recent tasks – review needed</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSettingsSheetOpen(true)}
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                Review Settings
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActivityFilter('review')}
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                View Low-Approval Tasks
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Actions Panel */}
      <Card className="glassmorphism-light border-slate-800/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button onClick={() => setRunModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Play className="w-4 h-4 mr-2" />
              Run Agent
            </Button>
            <Button onClick={() => setAutomationModalOpen(true)} variant="outline" className="border-slate-700 text-white hover:bg-slate-800/50">
              <GitBranch className="w-4 h-4 mr-2" />
              Add to Automation
            </Button>
            <Button onClick={() => setSettingsSheetOpen(true)} variant="outline" className="border-slate-700 text-white hover:bg-slate-800/50">
              <Settings className="w-4 h-4 mr-2" />
              Edit Settings
            </Button>
            <Button onClick={() => setShowChat(!showChat)} variant="outline" className="border-slate-700 text-white hover:bg-slate-800/50">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat with Agent
            </Button>
          </div>
          <div className="text-sm text-slate-400">
            {tasks.length > 0 ? (
              <>
                Last run:{' '}
                <button 
                  onClick={() => handleViewTask(tasks[0])}
                  className="text-blue-400 hover:underline"
                >
                  {(() => {
                    const lastTask = tasks[0];
                    const diff = Date.now() - new Date(lastTask.created_date).getTime();
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    if (hours < 1) return 'just now';
                    if (hours < 24) return `${hours}h ago`;
                    return `${Math.floor(hours / 24)}d ago`;
                  })()}
                </button>
                {workspaces.length > 0 && (
                  <>
                    {' '}for{' '}
                    <button 
                      onClick={() => handleViewWorkspace(workspaces[0].id)}
                      className="text-blue-400 hover:underline"
                    >
                      {workspaces[0].name}
                    </button>
                  </>
                )}
              </>
            ) : (
              'No tasks yet'
            )}
          </div>
        </div>
      </Card>

      {/* Performance Cards */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className="glassmorphism-light border-slate-800/50 p-6 hover:border-blue-500/30 transition-colors cursor-pointer h-full">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white">{completedTasks}</p>
              <p className="text-sm text-slate-400 mt-1">Tasks completed this week</p>
              <div className="mt-2 h-5">
                {completedTasks > 0 ? (
                  <Button 
                    variant="link" 
                    onClick={handleViewCompletedTasks}
                    className="text-blue-400 hover:text-blue-300 p-0 h-auto text-xs"
                  >
                    View tasks →
                  </Button>
                ) : (
                  <p className="text-xs text-slate-500">No tasks completed yet</p>
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glassmorphism-light border-slate-800/50 p-6 h-full">
              <div className="flex items-center justify-between mb-3">
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{totalTasks > 0 ? `${approvalRate}%` : '–'}</p>
              <p className="text-sm text-slate-400 mt-1">Client approval rate (last 30 days)</p>
              <div className="mt-2 h-5">
                {totalTasks === 0 && (
                  <p className="text-xs text-slate-500">No reviews yet</p>
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glassmorphism-light border-slate-800/50 p-6 h-full">
              <div className="flex items-center justify-between mb-3">
                <Clock className="w-8 h-8 text-purple-400" />
                <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 font-medium">
                  This Week
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{hoursSaved}h</p>
              <p className="text-sm text-slate-400 mt-1">Estimated hours saved</p>
              <div className="mt-2 h-5">
                <p className="text-xs text-slate-500">Based on typical manual time per task</p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Where This Agent Is Used */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glassmorphism-light border-slate-800/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Clients Using This Agent</h3>
            </div>
            <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800/50 text-xs">
              + Assign to Client
            </Button>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-12 gap-4 px-3 pb-2 border-b border-slate-800/50 mb-2">
            <div className="col-span-5 text-xs font-medium text-slate-500 uppercase">Client</div>
            <div className="col-span-3 text-xs font-medium text-slate-500 uppercase text-right">Campaigns</div>
            <div className="col-span-3 text-xs font-medium text-slate-500 uppercase text-right">Last Used</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-2">
            {workspaces.slice(0, 5).map((workspace) => (
              <div 
                key={workspace.id} 
                className="grid grid-cols-12 gap-4 items-center p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors group cursor-pointer"
                onClick={() => handleViewWorkspace(workspace.id)}
              >
                <div className="col-span-5 flex items-center space-x-2">
                  <span className="text-white font-medium">{workspace.name}</span>
                  <Badge className="bg-blue-500/20 text-blue-400 text-xs" title="Usage level based on task frequency">High usage</Badge>
                </div>
                <div className="col-span-3 text-right">
                  <span className="text-slate-300">{workspace.project_count || 0}</span>
                </div>
                <div className="col-span-3 text-right">
                  <span className="text-xs text-slate-400">2 days ago</span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivityFilter('all');
                          document.querySelector('#recent-activity')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-slate-300 focus:bg-slate-700 focus:text-white"
                      >
                        View tasks for this client
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => e.stopPropagation()}
                        className="text-red-400 focus:bg-slate-700 focus:text-red-400"
                      >
                        Remove agent from client
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glassmorphism-light border-slate-800/50 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FolderKanban className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Active Campaigns</h3>
          </div>
          {projects.length > 0 ? (
            <div className="space-y-2">
              {projects.slice(0, 5).map((project) => {
                const workspace = workspaces.find(w => w.id === project.workspace_id);
                return (
                  <div key={project.id} className="p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors group">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{project.name}</span>
                          <Badge className={
                            project.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            project.status === 'planning' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-slate-500/20 text-slate-400'
                          }>
                            {project.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{workspace?.name || 'Unknown Client'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-slate-500">
                        <span>3 tasks in progress</span>
                        <span className="mx-2">•</span>
                        <span>Next run: Tomorrow</span>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-800">
                          Run now
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400 hover:text-white hover:bg-slate-800">
                          Pause
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h4 className="text-white font-medium mb-2">This agent isn't attached to any active campaigns yet</h4>
              <p className="text-sm text-slate-400 mb-4">Get started by attaching it to a campaign or creating a new one</p>
              <div className="flex items-center justify-center space-x-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(createPageUrl('Campaigns'))}
                  className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800/50"
                >
                  Browse Campaigns
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate(createPageUrl('Campaigns'))}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create Campaign with This Agent
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <div className="flex space-x-6">
          {['overview', 'skills', 'training', 'performance', 'tuning'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Recent Activity */}
          <Card id="recent-activity" className="glassmorphism-light border-slate-800/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-slate-300 focus:bg-slate-700 focus:text-white">All</SelectItem>
              <SelectItem value="completed" className="text-slate-300 focus:bg-slate-700 focus:text-white">Completed</SelectItem>
              <SelectItem value="review" className="text-slate-300 focus:bg-slate-700 focus:text-white">Needs Review</SelectItem>
              <SelectItem value="errors" className="text-slate-300 focus:bg-slate-700 focus:text-white">Errors</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          {filteredTasks.slice(0, 8).map((task) => {
            const getStatusIcon = () => {
              if (task.status === 'completed') return <CheckCircle2 className="w-4 h-4 text-green-400" />;
              if (task.status === 'failed') return <XCircle className="w-4 h-4 text-red-400" />;
              if (task.status === 'running') return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
              return <Clock className="w-4 h-4 text-slate-400" />;
            };

            return (
              <div key={task.id} className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors group">
                <div className="mt-1">{getStatusIcon()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-white font-medium">{task.title}</p>
                    <Badge className={
                      task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      task.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      task.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-slate-500/20 text-slate-400'
                    }>
                      {task.status === 'pending' ? 'Needs review' : task.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400">{task.description || 'No description'}</p>
                  <div className="flex items-center space-x-3 mt-2 text-xs text-slate-500">
                    <span>{new Date(task.created_date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{new Date(task.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => handleViewTask(task)}
                  className="text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </Card>
        </>
      )}

      {activeTab === 'skills' && (
        <AgentSkillsManager
          agent={agent}
          onUpdateSkills={(skills) => updateAgentMutation.mutate({ skills })}
        />
      )}

      {activeTab === 'training' && (
        <AgentTrainingPanel agent={agent} />
      )}

      {activeTab === 'performance' && (
        <PerformanceDashboard agent={agent} />
      )}

      {activeTab === 'tuning' && (
        <AgentPerformanceTuning agentId={agentId} />
      )}

      {/* Modals */}
      <RunAgentModal 
        open={runModalOpen}
        onOpenChange={setRunModalOpen}
        agent={agent}
        workspaces={workspaces}
        projects={projects}
        onRun={handleRunAgent}
      />
      
      <AddToAutomationModal
        open={automationModalOpen}
        onOpenChange={setAutomationModalOpen}
        agent={agent}
        onAdd={handleAddToAutomation}
      />
      
      <EditSettingsSheet
        open={settingsSheetOpen}
        onOpenChange={setSettingsSheetOpen}
        agent={agent}
        onSave={handleSaveSettings}
      />

      {/* Floating Chat */}
      {showChat && (
        <FloatingAgentChat
          agent={agent}
          onClose={() => setShowChat(false)}
          onOpenSettings={() => setSettingsSheetOpen(true)}
        />
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        open={taskDetailOpen}
        onOpenChange={setTaskDetailOpen}
        task={selectedTask}
        agent={agent}
        workspace={selectedTask ? workspaces.find(w => w.id === selectedTask.workspace_id) : null}
      />
    </div>
  );
}