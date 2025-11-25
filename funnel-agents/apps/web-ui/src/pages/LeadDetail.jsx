import { useNavigate } from 'react-router-dom';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Mail, Phone, Linkedin, Globe, Bot, CheckCircle2, Loader2 } from 'lucide-react';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import AISummaryCard from '../components/leads/AISummaryCard';
import LeadTimeline from '../components/leads/LeadTimeline';
import LeadScoreBreakdown from '../components/leads/LeadScoreBreakdown';

export default function LeadDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const leadId = urlParams.get('id');

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const response = await client.get(`/api/crm/leads/${leadId}`);
      return response;
    },
    enabled: !!leadId,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: async () => {
      const response = await client.get(`/api/crm/leads/${leadId}/activities`);
      return Array.isArray(response) ? response : response.data || [];
    },
    enabled: !!leadId,
    initialData: [],
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => client.patch(`/api/crm/leads/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead updated');
    },
  });

  const createActivityMutation = useMutation({
    mutationFn: (activityData) => client.post('/api/crm/lead-activities', activityData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] });
    },
  });

  const handleStatusChange = (newStatus) => {
    updateLeadMutation.mutate({
      id: leadId,
      data: { 
        status: newStatus,
        last_activity_date: new Date().toISOString()
      }
    });

    createActivityMutation.mutate({
      lead_id: leadId,
      type: 'status_change',
      title: `Status changed to ${newStatus}`,
      actor_type: 'human',
      actor: 'User'
    });
  };

  const handleQualify = async () => {
    try {
      toast.info('Starting AI qualification...');
      
      updateLeadMutation.mutate({
        id: leadId,
        data: { qualification_status: 'processing' }
      });

      createActivityMutation.mutate({
        lead_id: leadId,
        type: 'ai_action',
        title: 'Lead Qualifier Agent started',
        description: 'Analyzing company, scoring lead, and identifying opportunities',
        actor_type: 'ai',
        actor: 'Lead Qualifier Agent'
      });

      // Simulate AI processing
      setTimeout(async () => {
        const mockSummary = `${lead.company} is a growing ${lead.industry || 'technology'} company with strong market presence. They show high potential for conversion based on website activity and engagement patterns.`;
        
        const mockScore = Math.floor(Math.random() * 30) + 70;
        const breakdown = {
          icp_fit: Math.floor(mockScore * 0.4),
          engagement: Math.floor(mockScore * 0.3),
          recency: Math.floor(mockScore * 0.2),
          agent_confidence: Math.floor(mockScore * 0.1)
        };

        updateLeadMutation.mutate({
          id: leadId,
          data: {
            qualification_status: 'completed',
            ai_summary: mockSummary,
            score: mockScore,
            score_breakdown: breakdown,
            company_size: '50-200 employees',
            industry: lead.industry || 'Technology',
            tech_stack: ['Salesforce', 'HubSpot', 'Slack'],
            pain_points: [
              'Manual lead qualification process',
              'Limited marketing automation',
              'Need better analytics and reporting'
            ],
            estimated_budget: '$10K-$50K annually',
            status: mockScore >= 75 ? 'qualified' : 'enriched',
            last_activity_date: new Date().toISOString()
          }
        });

        createActivityMutation.mutate({
          lead_id: leadId,
          type: 'score_updated',
          title: 'Lead scored and qualified',
          description: `Score: ${mockScore}/100 - ${mockScore >= 75 ? 'Qualified' : 'Needs review'}`,
          actor_type: 'ai',
          actor: 'Lead Qualifier Agent'
        });

        toast.success('Lead qualified successfully!');
      }, 3000);
    } catch (error) {
      toast.error('Failed to qualify lead');
    }
  };

  const handleGenerateOutreach = () => {
    toast.info('Generating outreach sequence...');
    
    createActivityMutation.mutate({
      lead_id: leadId,
      type: 'ai_action',
      title: 'Outreach Agent drafted email sequence',
      description: 'Created personalized 3-email sequence based on pain points',
      actor_type: 'ai',
      actor: 'Outreach Agent'
    });

    setTimeout(() => {
      toast.success('Outreach sequence ready for review');
    }, 2000);
  };

  const handleConvertToClient = () => {
    toast.success('Lead converted to client workspace');
    navigate(createPageUrl('Workspaces'));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Lead not found</p>
      </div>
    );
  }

  const statusColors = {
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

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(createPageUrl('Leads'))}
        className="text-slate-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Leads
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <span className="text-white text-xl font-semibold">
              {lead.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{lead.name}</h1>
            <p className="text-slate-400 text-lg mt-1">{lead.company}</p>
            <div className="flex items-center space-x-3 mt-3">
              <Select value={lead.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="new" className="text-slate-300">New</SelectItem>
                  <SelectItem value="enriched" className="text-slate-300">Enriched</SelectItem>
                  <SelectItem value="qualified" className="text-slate-300">Qualified</SelectItem>
                  <SelectItem value="contacted" className="text-slate-300">Contacted</SelectItem>
                  <SelectItem value="in_conversation" className="text-slate-300">In Conversation</SelectItem>
                  <SelectItem value="proposal_sent" className="text-slate-300">Proposal Sent</SelectItem>
                  <SelectItem value="won" className="text-slate-300">Won</SelectItem>
                  <SelectItem value="lost" className="text-slate-300">Lost</SelectItem>
                  <SelectItem value="disqualified" className="text-slate-300">Disqualified</SelectItem>
                </SelectContent>
              </Select>
              {lead.source && (
                <Badge variant="outline" className="bg-slate-800/50 border-slate-700 text-slate-300">
                  {lead.source}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleQualify}
            variant="outline"
            className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
            disabled={lead.qualification_status === 'processing'}
          >
            {lead.qualification_status === 'processing' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Qualifying...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 mr-2" />
                Qualify with AI
              </>
            )}
          </Button>
          <Button
            onClick={handleGenerateOutreach}
            variant="outline"
            className="border-purple-600 text-purple-400 hover:bg-purple-600/10"
          >
            <Mail className="w-4 h-4 mr-2" />
            Generate Outreach
          </Button>
          {lead.status === 'qualified' && (
            <Button
              onClick={handleConvertToClient}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Convert to Client
            </Button>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <Card className="glassmorphism-light border-slate-800/50 p-6">
        <h3 className="text-white font-semibold mb-4">Contact Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-slate-400 text-xs">Email</p>
              <p className="text-white">{lead.email}</p>
            </div>
          </div>
          {lead.phone && (
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-slate-400 text-xs">Phone</p>
                <p className="text-white">{lead.phone}</p>
              </div>
            </div>
          )}
          {lead.linkedin && (
            <div className="flex items-center space-x-3">
              <Linkedin className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-slate-400 text-xs">LinkedIn</p>
                <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  Profile
                </a>
              </div>
            </div>
          )}
          {lead.website && (
            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-slate-400 text-xs">Website</p>
                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  {lead.website}
                </a>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AISummaryCard lead={lead} onQualify={handleQualify} />
          <LeadTimeline activities={activities} />
        </div>
        <div className="space-y-6">
          <LeadScoreBreakdown score={lead.score} breakdown={lead.score_breakdown} />
        </div>
      </div>
    </div>
  );
}