import { useState, useEffect } from 'react';
import client from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, TrendingUp, Users, Calendar, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import LeadsGrid from '../components/leads/LeadsGrid';
import CommunicationHub from '../components/client/CommunicationHub';
import AIInsightsPanel from '../components/client/AIInsightsPanel';
import AIReportCard from '../components/client/AIReportCard';
import AgentCollaborationFeed from '../components/client/AgentCollaborationFeed';
import ClientAgentTeam from '../components/client/ClientAgentTeam';
import ClientFeedbackDashboard from '../components/feedback/ClientFeedbackDashboard';
import { formatDistanceToNow } from 'date-fns';

export default function ClientWorkspace() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const clientId = params.get('id');
  const [activeTab, setActiveTab] = useState(params.get('tab') || 'overview');
  const [insights, setInsights] = useState(null);

  const { data: workspace, isLoading: workspaceLoading } = useQuery({
    queryKey: ['workspace', clientId],
    queryFn: async () => {
      const workspaces = await client.entities.Workspace.list();
      return workspaces.find(w => w.id === clientId);
    },
    enabled: !!clientId,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns', clientId],
    queryFn: async () => {
      const allCampaigns = await client.entities.Campaign.list();
      return allCampaigns.filter(c => c.client_id === clientId);
    },
    enabled: !!clientId,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads', clientId],
    queryFn: async () => {
      const allLeads = await client.entities.Lead.list();
      // Filter leads that were assigned to campaigns for this client
      const clientCampaignIds = campaigns.map(c => c.id);
      return allLeads.filter(l => 
        l.converted_to_client_id === clientId || 
        (l.campaign_ids && l.campaign_ids.some(cid => clientCampaignIds.includes(cid)))
      );
    },
    enabled: !!clientId && campaigns.length >= 0,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', clientId],
    queryFn: async () => {
      const allTasks = await client.entities.Task.list('-created_date', 100);
      return allTasks.filter(t => t.client_id === clientId);
    },
    enabled: !!clientId,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', clientId],
    queryFn: async () => {
      const allActivities = await client.entities.LeadActivity.list('-created_date', 20);
      const clientLeadIds = leads.map(l => l.id);
      return allActivities.filter(a => clientLeadIds.includes(a.lead_id));
    },
    enabled: !!clientId && leads.length > 0,
  });

  useEffect(() => {
    const tabParam = params.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [window.location.search]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    const newUrl = createPageUrl('ClientWorkspace') + `?id=${clientId}&tab=${value}`;
    window.history.pushState({}, '', newUrl);
  };

  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Client not found</p>
      </div>
    );
  }

  const colorOptions = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-red-500',
    yellow: 'from-yellow-500 to-amber-500',
  };

  const activeTasks = tasks.filter(t => t.status === 'running').length;
  const completedThisWeek = tasks.filter(t => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return t.status === 'completed' && new Date(t.completed_at).getTime() > weekAgo;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('Workspaces'))}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorOptions[workspace.color] || colorOptions.blue} flex items-center justify-center`}>
            <FolderOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{workspace.name}</h1>
            <p className="text-slate-400 mt-1">{workspace.description || 'Client workspace'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="bg-slate-800/50 border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white">
            Campaigns ({campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="leads" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white">
            Leads ({leads.length})
          </TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white">
            Contacts
          </TabsTrigger>
          <TabsTrigger value="agents" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white">
            Agent Team
          </TabsTrigger>
          <TabsTrigger value="collaborations" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white">
            Collaborations
          </TabsTrigger>
          <TabsTrigger value="communications" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white">
            Communications
          </TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white">
            Tasks ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="feedback" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white">
            Feedback
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* AI Insights & Report */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIInsightsPanel clientId={clientId} workspace={workspace} />
            {insights?.report && <AIReportCard report={insights.report} clientId={clientId} />}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glassmorphism-light border-slate-800/50 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Campaigns</span>
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{campaigns.length}</div>
            </Card>
            <Card className="glassmorphism-light border-slate-800/50 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Leads</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{leads.length}</div>
            </Card>
            <Card className="glassmorphism-light border-slate-800/50 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Active Tasks</span>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{activeTasks}</div>
            </Card>
            <Card className="glassmorphism-light border-slate-800/50 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Shipped This Week</span>
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{completedThisWeek}</div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="glassmorphism-light border-slate-800/50 p-6">
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
            {activities.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 10).map((activity) => {
                  const lead = leads.find(l => l.id === activity.lead_id);
                  return (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{activity.title}</p>
                        <p className="text-slate-400 text-xs mt-1">
                          {lead?.name} • {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-slate-400">{campaigns.length} {campaigns.length === 1 ? 'campaign' : 'campaigns'}</p>
            <Button
              onClick={() => navigate(createPageUrl('Projects') + `?workspace=${clientId}&new=true`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
          {campaigns.length === 0 ? (
            <Card className="glassmorphism-light border-slate-800/50 p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">No campaigns yet</p>
              <Button
                onClick={() => navigate(createPageUrl('Projects') + `?workspace=${clientId}&new=true`)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create First Campaign
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((campaign) => (
                <Card 
                  key={campaign.id} 
                  className="glassmorphism-light border-slate-800/50 p-4 hover:border-blue-500/30 transition-all cursor-pointer"
                  onClick={() => navigate(createPageUrl('CampaignDetail') + `?id=${campaign.id}`)}
                >
                  <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{campaign.name}</h4>
                  <p className="text-slate-400 text-sm line-clamp-2 mb-3">{campaign.description || 'No description'}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded ${
                      campaign.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      campaign.status === 'planning' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {campaign.status}
                    </span>
                    <span className="text-slate-500">{campaign.progress || 0}% complete</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads">
          <LeadsGrid clientId={clientId} showClientColumn={false} />
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-slate-400">Contacts for {workspace.name}</p>
            <Button
              onClick={() => navigate(createPageUrl('Contacts') + `?client=${clientId}&new=true`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
          <Card className="glassmorphism-light border-slate-800/50 p-6">
            <p className="text-slate-400 text-center">Contact management coming soon</p>
          </Card>
        </TabsContent>

        {/* Agent Team Tab */}
        <TabsContent value="agents">
          <ClientAgentTeam clientId={clientId} />
        </TabsContent>

        {/* Collaborations Tab */}
        <TabsContent value="collaborations">
          <AgentCollaborationFeed clientId={clientId} />
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications">
          <CommunicationHub client={workspace} />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-slate-400">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</p>
          </div>
          {tasks.length === 0 ? (
            <Card className="glassmorphism-light border-slate-800/50 p-12 text-center">
              <p className="text-slate-400">No tasks yet</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <Card key={task.id} className="glassmorphism-light border-slate-800/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>{task.title}</h4>
                      <p className="text-slate-400 text-sm mt-1">{task.agent_name}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-xs ${
                      task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      task.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                      task.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback">
          <ClientFeedbackDashboard clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}