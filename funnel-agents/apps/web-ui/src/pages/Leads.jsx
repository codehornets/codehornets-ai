import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Users, TrendingUp, Star } from 'lucide-react';
import client from '@/api/client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import ImportLeadsModal from '../components/leads/ImportLeadsModal';
import LeadsGrid from '../components/leads/LeadsGrid';
import LeadDetailDrawer from '../components/leads/LeadDetailDrawer';
import SavedViews from '../components/leads/SavedViews';
import BulkActions from '../components/leads/BulkActions';
import { toast } from 'sonner';
import { useLeadQualification } from '@/hooks/useAgentExecution';
import { useWebSocket, WS_CHANNELS, WS_EVENTS } from '@/hooks/useWebSocket';
import { createPageUrl } from '../utils';

export default function Leads() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('score');
  const [activeView, setActiveView] = useState('all');
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [qualifyingLeadId, setQualifyingLeadId] = useState(null);
  const queryClient = useQueryClient();

  // Initialize WebSocket and agent execution hooks
  const ws = useWebSocket();
  const leadQualification = useLeadQualification();

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const response = await client.get('/api/crm/leads');
      return Array.isArray(response) ? response : response.data || [];
    },
    initialData: [],
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['lead-activities', selectedLead?.id],
    queryFn: async () => {
      const response = await client.get(`/api/crm/leads/${selectedLead.id}/activities`);
      return Array.isArray(response) ? response : response.data || [];
    },
    enabled: !!selectedLead?.id,
    initialData: [],
  });

  const createActivityMutation = useMutation({
    mutationFn: (activityData) => client.post('/api/crm/lead-activities', activityData),
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => client.patch(`/api/crm/leads/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: (id) => client.delete(`/api/crm/leads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead deleted');
    },
  });

  const handleImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] });
  };

  // Subscribe to WebSocket lead updates
  useEffect(() => {
    if (ws.isConnected) {
      ws.subscribe(WS_CHANNELS.LEADS);
      ws.subscribe(WS_CHANNELS.AGENTS);

      // Listen for lead qualification completion
      const unsubscribeLead = ws.on(WS_EVENTS.LEAD_QUALIFIED, (data) => {
        if (data.lead_id) {
          queryClient.invalidateQueries({ queryKey: ['leads'] });
          queryClient.invalidateQueries({ queryKey: ['lead', data.lead_id] });
          toast.success(`Lead ${data.lead_name || ''} has been qualified!`);
        }
      });

      return () => {
        unsubscribeLead();
      };
    }
  }, [ws.isConnected, queryClient]);

  const handleQualifyLead = async (lead) => {
    if (!lead) return;

    try {
      setQualifyingLeadId(lead.id);
      toast.info('Starting AI qualification...', { id: `qualify-${lead.id}` });

      // Update lead status to processing
      updateLeadMutation.mutate({
        id: lead.id,
        data: { qualification_status: 'processing' }
      });

      // Log activity
      createActivityMutation.mutate({
        lead_id: lead.id,
        type: 'ai_action',
        title: 'Lead Qualifier Agent started',
        description: 'Analyzing lead data, scoring, and generating insights',
        actor_type: 'ai',
        actor: 'Lead Qualifier Agent'
      });

      // Execute the real agent
      const _result = await leadQualification.qualifyLead(lead);

      // Process results from agent execution
      if (leadQualification.isCompleted && leadQualification.result) {
        const agentResult = leadQualification.result;

        const score = agentResult.score || agentResult.qualification_score || 0;
        const breakdown = agentResult.score_breakdown || {
          icp_fit: Math.floor(score * 0.4),
          engagement: Math.floor(score * 0.3),
          recency: Math.floor(score * 0.2),
          agent_confidence: Math.floor(score * 0.1)
        };

        // Update lead with AI results
        updateLeadMutation.mutate({
          id: lead.id,
          data: {
            qualification_status: 'completed',
            score: score,
            score_breakdown: breakdown,
            status: score >= 75 ? 'qualified' : 'enriched',
            ai_summary: agentResult.summary || agentResult.analysis || `AI analysis complete for ${lead.company}`,
            company_size: agentResult.company_size,
            industry: agentResult.industry || lead.industry,
            tech_stack: agentResult.tech_stack,
            pain_points: agentResult.pain_points,
            estimated_budget: agentResult.estimated_budget,
            last_activity_date: new Date().toISOString()
          }
        });

        // Log completion activity
        createActivityMutation.mutate({
          lead_id: lead.id,
          type: 'score_updated',
          title: 'Lead scored and qualified',
          description: `Score: ${score}/100 - ${score >= 75 ? 'Qualified' : 'Needs review'}`,
          actor_type: 'ai',
          actor: 'Lead Qualifier Agent'
        });

        // Update selected lead if it's the current one
        if (selectedLead?.id === lead.id) {
          setSelectedLead(prev => ({
            ...prev,
            score,
            score_breakdown: breakdown,
            ai_summary: agentResult.summary || agentResult.analysis
          }));
        }

        toast.success('Lead qualified successfully!', { id: `qualify-${lead.id}` });
      }
    } catch (error) {
      console.error('Lead qualification error:', error);

      // Update lead status to failed
      updateLeadMutation.mutate({
        id: lead.id,
        data: {
          qualification_status: 'failed',
          last_activity_date: new Date().toISOString()
        }
      });

      // Log error activity
      createActivityMutation.mutate({
        lead_id: lead.id,
        type: 'error',
        title: 'Lead qualification failed',
        description: error.message || 'An error occurred during AI qualification',
        actor_type: 'ai',
        actor: 'Lead Qualifier Agent'
      });

      toast.error(`Failed to qualify lead: ${error.message}`, { id: `qualify-${lead.id}` });
    } finally {
      setQualifyingLeadId(null);
      leadQualification.reset();
    }
  };

  const _handleLeadAction = async (action, lead) => {
    switch (action) {
      case 'qualify':
        await handleQualifyLead(lead);
        break;
      case 'outreach':
        toast.info('Generating outreach...');
        createActivityMutation.mutate({
          lead_id: lead.id,
          type: 'ai_action',
          title: 'Outreach sequence generated',
          actor_type: 'ai',
          actor: 'Outreach Agent'
        });
        setTimeout(() => toast.success('Outreach ready!'), 1500);
        break;
      case 'call':
        createActivityMutation.mutate({
          lead_id: lead.id,
          type: 'call_logged',
          title: 'Call logged',
          actor_type: 'human',
          actor: 'You'
        });
        toast.success('Call logged');
        break;
      case 'task':
        navigate(createPageUrl('Tasks') + `?lead=${lead.id}`);
        break;
    }
  };

  const _handleLeadClick = (lead) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
  };

  const _handleFieldUpdate = (leadId, field, value) => {
    updateLeadMutation.mutate({
      id: leadId,
      data: { [field]: value, last_activity_date: new Date().toISOString() }
    });
    toast.success('Lead updated');
  };

  const _handleSelectLead = (leadId) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const _handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const handleStatusChange = (newStatus) => {
    if (!selectedLead) return;
    updateLeadMutation.mutate({
      id: selectedLead.id,
      data: {
        status: newStatus,
        last_activity_date: new Date().toISOString()
      }
    });
    createActivityMutation.mutate({
      lead_id: selectedLead.id,
      type: 'status_change',
      title: `Status changed to ${newStatus}`,
      actor_type: 'human',
      actor: 'User'
    });
    setSelectedLead({ ...selectedLead, status: newStatus });
  };

  const handleQualify = () => {
    if (!selectedLead) return;
    handleQualifyLead(selectedLead);
  };

  const handleGenerateOutreach = () => {
    if (!selectedLead) return;
    toast.info('Generating outreach...');
    createActivityMutation.mutate({
      lead_id: selectedLead.id,
      type: 'ai_action',
      title: 'Outreach sequence generated',
      actor_type: 'ai',
      actor: 'Outreach Agent'
    });
    setTimeout(() => toast.success('Outreach ready!'), 1500);
  };

  const handleConvertToClient = async (conversionData) => {
    try {
      // Create new client workspace
      const newClient = await client.post('/api/workspaces', conversionData.clientData);

      // Update lead with client reference
      await updateLeadMutation.mutateAsync({
        id: selectedLead.id,
        data: {
          converted_to_client_id: newClient.id,
          status: 'won',
        }
      });

      // Create default campaign if requested
      if (conversionData.createCampaign) {
        await client.post('/api/campaigns', {
          name: conversionData.campaignName,
          workspace_id: newClient.id,
          status: 'active',
        });
      }

      // Create onboarding automation if requested
      if (conversionData.createAutomation) {
        await client.post('/api/automations/workflows', {
          name: 'Client Onboarding',
          description: `Onboarding workflow for ${newClient.name}`,
          status: 'active',
          workspace_id: newClient.id,
        });
      }

      toast.success(`Lead converted to client: ${newClient.name}`);
      setDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch (error) {
      toast.error('Failed to convert lead: ' + error.message);
    }
  };

  const handleDeleteLead = (leadId) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      deleteLeadMutation.mutate(leadId);
      setDrawerOpen(false);
    }
  };

  const displayLeads = leads;

  const _statusColors = {
    new: 'bg-blue-500/20 text-blue-400',
    enriched: 'bg-cyan-500/20 text-cyan-400',
    qualified: 'bg-green-500/20 text-green-400',
    contacted: 'bg-yellow-500/20 text-yellow-400',
    in_conversation: 'bg-purple-500/20 text-purple-400',
    proposal_sent: 'bg-orange-500/20 text-orange-400',
    won: 'bg-emerald-500/20 text-emerald-400',
    lost: 'bg-red-500/20 text-red-400',
    disqualified: 'bg-slate-500/20 text-slate-400',
  };

  // Apply view filter
  const viewFilteredLeads = displayLeads.filter(lead => {
    if (activeView === 'all') return true;
    if (activeView === 'new_week') {
      if (!lead.created_date) return false;
      const created = new Date(lead.created_date);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return created > weekAgo;
    }
    if (activeView === 'my_leads') {
      // Would filter by owner email
      return true;
    }
    if (activeView === 'high_score') {
      return (lead.score || 0) >= 80;
    }
    if (activeView === 'needs_followup') {
      return lead.status === 'contacted' || lead.status === 'in_conversation';
    }
    return true;
  });

  const filteredLeads = viewFilteredLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'score') return (b.score || 0) - (a.score || 0);
    if (sortBy === 'recent') {
      const dateA = new Date(a.last_activity_date || a.created_date);
      const dateB = new Date(b.last_activity_date || b.created_date);
      return dateB - dateA;
    }
    return 0;
  });

  const leadsCount = {
    all: displayLeads.length,
    newWeek: displayLeads.filter(l => {
      if (!l.created_date) return false;
      const created = new Date(l.created_date);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return created > weekAgo;
    }).length,
    myLeads: displayLeads.length,
    highScore: displayLeads.filter(l => (l.score || 0) >= 80).length,
    needsFollowup: displayLeads.filter(l => l.status === 'contacted' || l.status === 'in_conversation').length,
  };

  const newLeadsThisWeek = displayLeads.filter(l => {
    if (!l.created_date) return false;
    const created = new Date(l.created_date);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return created > weekAgo;
  }).length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Leads</h1>
          <p className="text-slate-400 mt-1">{newLeadsThisWeek} new leads this week</p>
        </div>
        <Button
          onClick={() => setImportModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Users className="w-4 h-4 mr-2" />
          Import Leads
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="glassmorphism-light border-slate-800/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Leads</p>
              <p className="text-white text-2xl font-bold mt-1">{displayLeads.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </Card>
        <Card className="glassmorphism-light border-slate-800/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">New This Week</p>
              <p className="text-white text-2xl font-bold mt-1">{newLeadsThisWeek}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        <Card className="glassmorphism-light border-slate-800/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Qualified</p>
              <p className="text-white text-2xl font-bold mt-1">
                {displayLeads.filter(l => l.status === 'qualified').length}
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>
        <Card className="glassmorphism-light border-slate-800/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Avg Score</p>
              <p className="text-white text-2xl font-bold mt-1">
                {displayLeads.length > 0 ? Math.round(displayLeads.reduce((sum, l) => sum + (l.score || 0), 0) / displayLeads.length) : 0}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Saved Views */}
      <SavedViews
        activeView={activeView}
        onViewChange={setActiveView}
        leadsCount={leadsCount}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedLeads.length}
        onClearSelection={() => setSelectedLeads([])}
        onBulkAction={(action) => toast.info(`Bulk action: ${action}`)}
      />

      {/* Filters & Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        <div className="relative flex-1 w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search across Name, Company, Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-slate-800/50 border-slate-700 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="enriched">Enriched</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="in_conversation">In Conversation</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-40 bg-slate-800/50 border-slate-700 text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="score">Highest Score</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Leads Grid */}
      <LeadsGrid />

      {/* Import Modal */}
      <ImportLeadsModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportComplete={handleImportComplete}
      />

      {/* Lead Detail Drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        activities={activities}
        onStatusChange={handleStatusChange}
        onQualify={handleQualify}
        onGenerateOutreach={handleGenerateOutreach}
        onConvert={handleConvertToClient}
        onDelete={handleDeleteLead}
      />
    </div>
  );
}
