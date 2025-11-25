import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Filter, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '../../utils';

export default function LeadsGrid({ clientId = null, showClientColumn = true }) {
  const navigate = useNavigate();
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ status: 'all', source: 'all' });
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    company: true,
    email: true,
    phone: true,
    score: true,
    status: true,
    source: true,
    owner: true,
    tags: true,
  });

  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: clientId ? ['leads', clientId] : ['leads'],
    queryFn: async () => {
      const response = await client.get('/api/crm/leads');
      const allLeads = Array.isArray(response) ? response : response.data || [];

      if (!clientId) return allLeads;

      // Filter leads for this client
      const campaignsResponse = await client.get('/api/campaigns');
      const allCampaigns = Array.isArray(campaignsResponse) ? campaignsResponse : campaignsResponse.data || [];
      const clientCampaigns = allCampaigns.filter(c => c.workspace_id === clientId);
      const clientCampaignIds = clientCampaigns.map(c => c.id);

      return allLeads.filter(l =>
        l.converted_to_client_id === clientId ||
        (l.campaign_ids && l.campaign_ids.some(cid => clientCampaignIds.includes(cid)))
      );
    },
    initialData: [],
  });

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const response = await client.get('/api/workspaces');
      return Array.isArray(response) ? response : response.data || [];
    },
    initialData: [],
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => client.patch(`/api/crm/leads/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setEditingCell(null);
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: (data) => client.post('/api/crm/leads', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead created');
    },
  });

  const handleCellEdit = (leadId, field, value) => {
    updateLeadMutation.mutate({ id: leadId, data: { [field]: value } });
  };

  const handleNewLead = () => {
    const newLead = {
      name: 'New Lead',
      email: 'email@example.com',
      workspace_id: clientId || null,
      status: 'new',
      score: 0,
    };
    createLeadMutation.mutate(newLead);
  };

  const toggleColumn = (column) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const toggleSelectLead = (leadId) => {
    setSelectedLeads(prev =>
      prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
    );
  };

  const filteredLeads = leads.filter(lead => {
    const statusMatch = filters.status === 'all' || lead.status === filters.status;
    const sourceMatch = filters.source === 'all' || lead.source === filters.source;
    return statusMatch && sourceMatch;
  });

  const statusColors = {
    new: 'bg-blue-500/20 text-blue-400',
    enriched: 'bg-purple-500/20 text-purple-400',
    qualified: 'bg-green-500/20 text-green-400',
    contacted: 'bg-yellow-500/20 text-yellow-400',
    in_conversation: 'bg-orange-500/20 text-orange-400',
    proposal_sent: 'bg-cyan-500/20 text-cyan-400',
    won: 'bg-emerald-500/20 text-emerald-400',
    lost: 'bg-red-500/20 text-red-400',
    disqualified: 'bg-slate-500/20 text-slate-400',
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Eye className="w-4 h-4 mr-2" />
              Columns
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {selectedLeads.length > 0 && (
            <span className="text-slate-400 text-sm">{selectedLeads.length} selected</span>
          )}
          <Button onClick={handleNewLead} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center space-x-3 p-4 bg-slate-800/30 rounded-lg">
          <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
            <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.source} onValueChange={(v) => setFilters({ ...filters, source: v })}>
            <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Grid */}
      <div className="bg-black/40 border border-slate-800/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr>
                <th className="p-3 text-left w-12">
                  <Checkbox
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                {visibleColumns.name && <th className="p-3 text-left text-slate-300 text-sm font-medium">Name</th>}
                {visibleColumns.company && <th className="p-3 text-left text-slate-300 text-sm font-medium">Company</th>}
                {visibleColumns.email && <th className="p-3 text-left text-slate-300 text-sm font-medium">Email</th>}
                {visibleColumns.phone && <th className="p-3 text-left text-slate-300 text-sm font-medium">Phone</th>}
                {visibleColumns.score && <th className="p-3 text-left text-slate-300 text-sm font-medium">Score</th>}
                {visibleColumns.status && <th className="p-3 text-left text-slate-300 text-sm font-medium">Status</th>}
                {visibleColumns.source && <th className="p-3 text-left text-slate-300 text-sm font-medium">Source</th>}
                {visibleColumns.owner && <th className="p-3 text-left text-slate-300 text-sm font-medium">Owner</th>}
                {visibleColumns.tags && <th className="p-3 text-left text-slate-300 text-sm font-medium">Tags</th>}
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                  onClick={() => navigate(createPageUrl('LeadDetail') + `?id=${lead.id}`)}
                >
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => toggleSelectLead(lead.id)}
                    />
                  </td>
                  {visibleColumns.name && (
                    <td className="p-3">
                      {editingCell === `${lead.id}-name` ? (
                        <Input
                          defaultValue={lead.name}
                          onBlur={(e) => handleCellEdit(lead.id, 'name', e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                          className="bg-slate-800 border-slate-700 text-white h-8"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span
                          className="text-white font-medium"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingCell(`${lead.id}-name`);
                          }}
                        >
                          {lead.name}
                        </span>
                      )}
                    </td>
                  )}
                  {visibleColumns.company && (
                    <td className="p-3">
                      {editingCell === `${lead.id}-company` ? (
                        <Input
                          defaultValue={lead.company}
                          onBlur={(e) => handleCellEdit(lead.id, 'company', e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                          className="bg-slate-800 border-slate-700 text-white h-8"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span
                          className="text-slate-300"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingCell(`${lead.id}-company`);
                          }}
                        >
                          {lead.company || '-'}
                        </span>
                      )}
                    </td>
                  )}
                  {visibleColumns.email && <td className="p-3 text-slate-300">{lead.email}</td>}
                  {visibleColumns.phone && <td className="p-3 text-slate-300">{lead.phone || '-'}</td>}
                  {visibleColumns.score && (
                    <td className="p-3">
                      <span className={`font-semibold ${getScoreColor(lead.score || 0)}`}>
                        {lead.score || 0}
                      </span>
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={lead.status}
                        onValueChange={(value) => handleCellEdit(lead.id, 'status', value)}
                      >
                        <SelectTrigger className="w-36 bg-slate-800/50 border-slate-700 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="in_conversation">In Conversation</SelectItem>
                          <SelectItem value="won">Won</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  )}
                  {visibleColumns.source && (
                    <td className="p-3">
                      <span className="text-slate-400 text-sm">{lead.source || '-'}</span>
                    </td>
                  )}
                  {visibleColumns.owner && (
                    <td className="p-3">
                      <span className="text-slate-400 text-sm">{lead.owner || '-'}</span>
                    </td>
                  )}
                  {visibleColumns.tags && (
                    <td className="p-3">
                      <div className="flex gap-1">
                        {(lead.tags || []).slice(0, 2).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-slate-800/50 border-slate-700">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  )}
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(createPageUrl('LeadDetail') + `?id=${lead.id}`);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLeads.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-slate-400">No leads found</p>
          </div>
        )}
      </div>
    </div>
  );
}