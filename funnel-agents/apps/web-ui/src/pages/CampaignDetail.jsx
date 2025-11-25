import { useState } from 'react';
import apiClient from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, MoreVertical, Bot, CheckSquare, FileText, TrendingUp, Calendar, Link2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
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
import CampaignKanban from '../components/campaign/CampaignKanban';
import CampaignActivityFeed from '../components/campaign/CampaignActivityFeed';
import CampaignPerformance from '../components/campaign/CampaignPerformance';
import AITaskMonitor from '../components/campaign/AITaskMonitor';
import AIContentGenerator from '../components/campaign/AIContentGenerator';
import AITimelineSuggestions from '../components/project/AITimelineSuggestions';
import AIProjectSummary from '../components/project/AIProjectSummary';
import TaskDetailPanel from '../components/tasks/TaskDetailPanel';

export default function CampaignDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get('id');
  const [activeTab, setActiveTab] = useState(params.get('tab') || 'overview');
  const [selectedTask, setSelectedTask] = useState(null);

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const response = await apiClient.get(`/campaigns/${campaignId}`);
      return response.data || response;
    },
    enabled: !!campaignId,
  });

  const { data: workspace } = useQuery({
    queryKey: ['workspace', campaign?.client_id],
    queryFn: async () => {
      const response = await apiClient.get(`/crm/workspaces/${campaign.client_id}`);
      return response.data || response;
    },
    enabled: !!campaign?.client_id,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['campaign-tasks', campaignId],
    queryFn: async () => {
      const response = await apiClient.get(`/tasks?campaign_id=${campaignId}&sort=-created_date`);
      return response.data || response;
    },
    enabled: !!campaignId,
    initialData: [],
  });

  const { data: content = [] } = useQuery({
    queryKey: ['campaign-content', campaignId],
    queryFn: async () => {
      const response = await apiClient.get(`/content?campaign_id=${campaignId}&sort=-created_date`);
      return response.data || response;
    },
    enabled: !!campaignId,
    initialData: [],
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await apiClient.get('/agents');
      return response.data || response;
    },
    initialData: [],
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch(`/campaigns/${id}`, data);
      return response.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      toast.success('Campaign updated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update campaign');
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/campaigns/${id}`);
    },
    onSuccess: () => {
      toast.success('Campaign archived');
      navigate(createPageUrl('Campaigns'));
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to archive campaign');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch(`/tasks/${id}`, data);
      return response.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-tasks', campaignId] });
      toast.success('Task updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update task');
    },
  });

  const handleStatusChange = (newStatus) => {
    updateCampaignMutation.mutate({
      id: campaignId,
      data: { status: newStatus }
    });
  };

  const handleAddTask = () => {
    // Navigate to create task page with campaign pre-filled
    navigate(createPageUrl('Tasks') + '?create=true&campaign_id=' + campaignId);
  };

  const handleAttachContent = () => {
    // Navigate to content library with campaign filter
    navigate(createPageUrl('ContentLibrary') + '?attach=true&campaign_id=' + campaignId);
  };

  const handleEditCampaign = () => {
    // TODO: Open edit modal or navigate to edit page
    toast.info('Edit campaign functionality coming soon');
  };

  const handleDuplicateCampaign = () => {
    if (!campaign) return;
    const duplicateData = {
      ...campaign,
      name: `${campaign.name} (Copy)`,
      status: 'draft',
    };
    delete duplicateData.id;

    apiClient.post('/campaigns', duplicateData)
      .then(() => {
        toast.success('Campaign duplicated');
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      })
      .catch((error) => {
        toast.error(error.message || 'Failed to duplicate campaign');
      });
  };

  const handleArchiveCampaign = () => {
    if (confirm('Are you sure you want to archive this campaign? This action cannot be undone.')) {
      deleteCampaignMutation.mutate(campaignId);
    }
  };

  const handleCreateContent = () => {
    navigate(createPageUrl('ContentLibrary') + '?create=true&campaign_id=' + campaignId);
  };

  const handleTaskAction = (task, action) => {
    switch (action) {
      case 'execute':
        updateTaskMutation.mutate({
          id: task.id,
          data: { status: 'running', started_at: new Date().toISOString() }
        });
        break;
      case 'cancel':
        updateTaskMutation.mutate({
          id: task.id,
          data: { status: 'cancelled' }
        });
        break;
      case 'retry':
        updateTaskMutation.mutate({
          id: task.id,
          data: {
            status: 'pending',
            error_message: null,
            started_at: null,
            completed_at: null,
            duration: null
          }
        });
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Campaign not found</p>
      </div>
    );
  }

  const usedAgents = [...new Set(tasks.map(t => t.agent_id))].map(agentId => 
    agents.find(a => a.id === agentId)
  ).filter(Boolean);

  const statusColors = {
    draft: 'bg-slate-500/20 text-slate-400',
    planning: 'bg-yellow-500/20 text-yellow-400',
    active: 'bg-green-500/20 text-green-400',
    paused: 'bg-orange-500/20 text-orange-400',
    completed: 'bg-blue-500/20 text-blue-400',
    archived: 'bg-slate-500/20 text-slate-400',
  };

  const tasksByStatus = {
    completed: tasks.filter(t => t.status === 'completed').length,
    running: tasks.filter(t => t.status === 'running').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('Campaigns'))}
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {campaign.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {workspace && (
                <>
                  <span className="font-medium">for {workspace.name}</span>
                  <span>·</span>
                </>
              )}
              {(campaign.start_date || campaign.end_date) && (
                <>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Start'} 
                    {' – '}
                    {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Ongoing'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Status Dropdown */}
          <Select value={campaign.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-40" style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-medium)' }}>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleAddTask} className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-initial">
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Task</span>
          </Button>

          <Button onClick={handleAttachContent} variant="outline" className="border-slate-700 text-white hover:bg-slate-800 flex-1 sm:flex-initial hidden md:flex">
            <Link2 className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Attach Content</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="border-slate-700 text-white hover:bg-slate-800">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
              <DropdownMenuItem onClick={handleEditCampaign} className="text-slate-300 focus:bg-slate-700 focus:text-white">
                Edit Campaign
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicateCampaign} className="text-slate-300 focus:bg-slate-700 focus:text-white">
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleArchiveCampaign} className="text-red-400 focus:bg-slate-700 focus:text-red-400">
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-4" style={{ 
          backgroundColor: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '12px'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Completed</p>
              <p className="text-slate-900 text-2xl font-bold">{tasksByStatus.completed}</p>
            </div>
            <CheckSquare className="w-7 h-7 text-green-600" />
          </div>
        </Card>
        <Card className="p-4" style={{ 
          backgroundColor: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '12px'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Running</p>
              <p className="text-slate-900 text-2xl font-bold">{tasksByStatus.running}</p>
            </div>
            <Bot className="w-7 h-7 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4" style={{ 
          backgroundColor: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '12px'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Agents Used</p>
              <p className="text-slate-900 text-2xl font-bold">{usedAgents.length}</p>
            </div>
            <Bot className="w-7 h-7 text-purple-600" />
          </div>
        </Card>
        <Card className="p-4" style={{ 
          backgroundColor: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '12px'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Success Rate</p>
              <p className="text-slate-900 text-2xl font-bold">
                {tasks.length > 0 ? Math.round((tasksByStatus.completed / tasks.length) * 100) : 0}%
              </p>
            </div>
            <TrendingUp className="w-7 h-7 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList style={{ 
          backgroundColor: 'var(--bg-surface)', 
          border: '1px solid var(--border-subtle)',
          padding: '4px'
        }}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="work">Work ({tasks.length})</TabsTrigger>
          <TabsTrigger value="content">Content ({content.length})</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 md:space-y-6">
          {/* AI Project Summary */}
          <AIProjectSummary
            project={campaign}
            tasks={tasks}
            agents={agents}
          />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
            {/* Left Column - Summary */}
            <div className="xl:col-span-2 space-y-4 md:space-y-6">
              <Card style={{ 
                backgroundColor: 'var(--bg-card)', 
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Campaign Summary
                </h3>
                <div className="space-y-4">
                  {campaign.goal && (
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Goal</span>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{campaign.goal}</p>
                    </div>
                  )}
                  {campaign.description && (
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Description</span>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{campaign.description}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Team</span>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-white flex items-center justify-center text-white text-xs font-semibold">
                            {i}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>3 team members</span>
                    </div>
                  </div>
                </div>
              </Card>

              <CampaignActivityFeed />
            </div>

            {/* Right Column - Metrics */}
            <div className="space-y-4">
              <Card style={{ 
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <h4 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">Tasks</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Open</span>
                    <span className="font-semibold text-slate-900">{tasksByStatus.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">In Progress</span>
                    <span className="font-semibold text-blue-600">{tasksByStatus.running}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Completed</span>
                    <span className="font-semibold text-green-600">{tasksByStatus.completed}</span>
                  </div>
                </div>
              </Card>

              <Card style={{ 
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <h4 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">Content</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Draft</span>
                    <span className="font-semibold text-slate-900">{content.filter(c => c.status === 'draft').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">In Review</span>
                    <span className="font-semibold text-blue-600">{content.filter(c => c.status === 'review').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Published</span>
                    <span className="font-semibold text-green-600">{content.filter(c => c.status === 'published').length}</span>
                  </div>
                </div>
              </Card>

              <Card style={{ 
                backgroundColor: 'white',
                border: '1px solid #DBEAFE',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-blue-600">Success Rate</span>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {tasks.length > 0 ? Math.round((tasksByStatus.completed / tasks.length) * 100) : 0}%
                </div>
                <p className="text-xs text-blue-600/70 mt-1">All tasks</p>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="work" className="space-y-6">
          {/* AI Timeline Suggestions */}
          <AITimelineSuggestions
            project={campaign}
            tasks={tasks}
            agents={agents}
          />

          {/* AI Task Monitor */}
          {tasks.length > 0 && (
            <AITaskMonitor
              tasks={tasks}
              agents={agents}
              campaign={campaign}
              client={workspace}
            />
          )}

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Manage all tasks and work for this campaign
            </p>
          </div>
          
          {tasks.length === 0 ? (
            <Card className="p-12 text-center" style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px'
            }}>
              <CheckSquare className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                No tasks yet
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Create your first task to start executing this campaign
              </p>
              <Button onClick={handleAddTask} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </Card>
          ) : (
            <CampaignKanban
              tasks={tasks}
              agents={agents}
              onTaskClick={setSelectedTask}
            />
          )}
        </TabsContent>



        <TabsContent value="content" className="space-y-4 md:space-y-6">
          {/* AI Content Generator */}
          <AIContentGenerator
            campaign={campaign}
            client={workspace}
            content={content}
            tasks={tasks}
          />

          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Campaign Content
            </h3>
            <div className="flex items-center space-x-2">
              <Button onClick={handleAttachContent} variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
                <Link2 className="w-4 h-4 mr-2" />
                Attach Existing
              </Button>
              <Button onClick={handleCreateContent} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Content
              </Button>
            </div>
          </div>

          {content.length === 0 ? (
            <Card className="p-12 text-center" style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px'
            }}>
              <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                No content attached yet
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Attach assets from the Content Library or create new content for this campaign
              </p>
              <div className="flex items-center justify-center space-x-3">
                <Button onClick={handleAttachContent} variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
                  Attach Content
                </Button>
                <Button onClick={handleCreateContent} className="bg-blue-600 hover:bg-blue-700">
                  New Content
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {content.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="p-4 hover:shadow-md transition-all cursor-pointer" style={{ 
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm text-slate-900">{item.title}</h4>
                      <Badge className="text-xs bg-slate-100 text-slate-700">
                        {item.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{item.channel}</span>
                      <span className={`px-2 py-0.5 rounded ${
                        item.status === 'published' ? 'bg-green-100 text-green-700' : 
                        item.status === 'review' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <CampaignPerformance />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Campaign Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Campaign Name
                </label>
                <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{campaign.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Client
                </label>
                <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{workspace?.name || '—'}</p>
              </div>
              <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <h4 className="text-sm font-semibold mb-3 text-red-600">Danger Zone</h4>
                <Button onClick={handleArchiveCampaign} variant="outline" className="border-red-500 text-red-500 hover:bg-red-50">
                  Archive Campaign
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Task Detail Panel */}
      <TaskDetailPanel
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        task={selectedTask}
        onTaskAction={handleTaskAction}
      />
    </div>
  );
}