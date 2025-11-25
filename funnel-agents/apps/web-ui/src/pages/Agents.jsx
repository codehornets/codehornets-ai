import React, { useState } from 'react';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Users, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AgentCard from '../components/agents/AgentCard';
import AgentFilters from '../components/agents/AgentFilters';
import AddAgentChooserModal from '../components/agents/AddAgentChooserModal';
import AddAgentSheet from '../components/agents/AddAgentSheet';

export default function Agents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All Domains');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('recent');
  const [chooserModalOpen, setChooserModalOpen] = useState(false);
  const [addAgentSheetOpen, setAddAgentSheetOpen] = useState(false);
  const [templateForAgent, setTemplateForAgent] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => client.entities.Agent.list(),
    initialData: [],
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => 
      client.entities.Agent.update(id, { status: status === 'active' ? 'inactive' : 'active' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  // Domain order following marketing lifecycle
  const domainOrder = [
    'Offer', 'Marketing', 'Sales', 'Fulfillment', 'Feedback Loop',
    'Operations', 'Customer Support', 'Leadership', 'Innovation', 'Enablement',
    'Business Development'
  ];

  // Get all unique skills from agents
  const availableSkills = React.useMemo(() => {
    const skillsSet = new Set();
    agents.forEach(agent => {
      if (agent.skills && Array.isArray(agent.skills)) {
        agent.skills.forEach(skill => skillsSet.add(skill));
      }
    });
    return Array.from(skillsSet).sort();
  }, [agents]);

  // Filter and sort agents
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (agent.skills && agent.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesDomain = selectedDomain === 'All Domains' || agent.domain === selectedDomain;
    const matchesStatus = selectedStatus === 'all' || agent.status === selectedStatus;
    const matchesSkill = selectedSkill === 'all' || (agent.skills && agent.skills.includes(selectedSkill));
    return matchesSearch && matchesDomain && matchesStatus && matchesSkill;
  }).sort((a, b) => {
    // First sort by domain (marketing lifecycle order)
    const domainIndexA = domainOrder.indexOf(a.domain);
    const domainIndexB = domainOrder.indexOf(b.domain);
    
    if (domainIndexA !== domainIndexB) {
      return domainIndexA - domainIndexB;
    }
    
    // Then by name within the same domain
    return a.name.localeCompare(b.name);
  });

  const handleToggleStatus = (agent) => {
    toggleStatusMutation.mutate({ id: agent.id, status: agent.status });
  };

  const handleAgentClick = (agent) => {
    navigate(createPageUrl('AgentDetail') + `?id=${agent.id}`);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Agents</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {filteredAgents.length} {filteredAgents.length === 1 ? 'agent' : 'agents'} across 10 business domains
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => navigate(createPageUrl('AgentTemplates'))}
            style={{ 
              border: '1px solid var(--border-medium)', 
              color: 'var(--text-primary)' 
            }}
            className="hover:bg-[var(--bg-surface-hover)]"
          >
            <FileText className="w-4 h-4 mr-2" />
            View Templates
          </Button>
          <Button 
            onClick={() => setChooserModalOpen(true)}
            className="text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Agent
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AgentFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedDomain={selectedDomain}
        setSelectedDomain={setSelectedDomain}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedSkill={selectedSkill}
        setSelectedSkill={setSelectedSkill}
        availableSkills={availableSkills}
        viewMode={viewMode}
        setViewMode={setViewMode}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* Agents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glassmorphism-light border-slate-800/50 p-6 rounded-lg animate-pulse">
              <div className="w-12 h-12 bg-slate-700 rounded-xl mb-4"></div>
              <div className="h-4 bg-slate-700 rounded mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="rounded-lg p-12 text-center" style={{ 
          backgroundColor: 'var(--bg-surface)', 
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Users className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No agents found</h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Try adjusting your filters or create a new agent.</p>
          <Button
            onClick={() => setChooserModalOpen(true)}
            className="text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Agent
          </Button>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6'
          : 'space-y-4'
        }>
          {filteredAgents.map((agent, index) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onClick={handleAgentClick}
              onToggleStatus={handleToggleStatus}
              delay={index * 0.05}
            />
          ))}
        </div>
      )}

      {/* Chooser Modal */}
      <AddAgentChooserModal
        open={chooserModalOpen}
        onOpenChange={setChooserModalOpen}
        onStartFromTemplate={() => {
          setChooserModalOpen(false);
          navigate(createPageUrl('AgentTemplates'));
        }}
        onCreateFromScratch={() => {
          setChooserModalOpen(false);
          setTemplateForAgent(null);
          setAddAgentSheetOpen(true);
        }}
      />

      {/* Add Agent Sheet */}
      <AddAgentSheet
        open={addAgentSheetOpen}
        onOpenChange={setAddAgentSheetOpen}
        template={templateForAgent}
      />
    </div>
  );
}