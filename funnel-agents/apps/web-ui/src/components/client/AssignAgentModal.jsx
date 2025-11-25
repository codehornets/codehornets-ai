import { useState } from 'react';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Search, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AssignAgentModal({ open, onOpenChange, clientId, campaignId = null }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [assignmentType, setAssignmentType] = useState('primary');
  const [responsibilities, setResponsibilities] = useState('');
  const [notes, setNotes] = useState('');

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => client.entities.Agent.list(),
    initialData: [],
  });

  const { data: existingAssignments = [] } = useQuery({
    queryKey: ['agent-assignments', clientId],
    queryFn: async () => {
      const all = await client.entities.AgentAssignment.list();
      return all.filter(a => a.client_id === clientId && a.status === 'active');
    },
    enabled: !!clientId,
    initialData: [],
  });

  const assignMutation = useMutation({
    mutationFn: async (data) => {
      const user = await client.auth.me();
      return client.entities.AgentAssignment.create({
        ...data,
        assigned_by: user.email,
        assigned_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-assignments'] });
      toast.success('Agent assigned successfully');
      onOpenChange(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setSelectedAgent(null);
    setAssignmentType('primary');
    setResponsibilities('');
    setNotes('');
    setSearchQuery('');
  };

  const handleAssign = () => {
    if (!selectedAgent) return;

    const responsibilitiesList = responsibilities
      .split('\n')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    assignMutation.mutate({
      agent_id: selectedAgent.id,
      agent_name: selectedAgent.name,
      agent_domain: selectedAgent.domain,
      agent_role: selectedAgent.role,
      client_id: clientId,
      campaign_id: campaignId,
      assignment_type: assignmentType,
      responsibilities: responsibilitiesList,
      notes,
    });
  };

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const alreadyAssignedIds = existingAssignments.map(a => a.agent_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" style={{ 
        backgroundColor: 'var(--bg-card)', 
        border: '1px solid var(--border-subtle)' 
      }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>
            Assign Agent to {campaignId ? 'Campaign' : 'Client'}
          </DialogTitle>
          <DialogDescription style={{ color: 'var(--text-secondary)' }}>
            Select an AI agent and define their role and responsibilities
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="space-y-2">
            <Label style={{ color: 'var(--text-primary)' }}>Search Agents</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <Input
                placeholder="Search by name, domain, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                style={{ 
                  backgroundColor: 'var(--bg-surface)', 
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Agent Selection */}
          <div className="space-y-2">
            <Label style={{ color: 'var(--text-primary)' }}>Available Agents</Label>
            <div className="max-h-64 overflow-y-auto space-y-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
              {filteredAgents.length === 0 ? (
                <p className="text-center py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                  No agents found
                </p>
              ) : (
                filteredAgents.map((agent) => {
                  const isAssigned = alreadyAssignedIds.includes(agent.id);
                  const isSelected = selectedAgent?.id === agent.id;

                  return (
                    <div
                      key={agent.id}
                      onClick={() => !isAssigned && setSelectedAgent(agent)}
                      className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        isAssigned ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
                      }`}
                      style={{
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card)',
                        borderColor: isSelected ? 'var(--accent)' : 'var(--border-subtle)',
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                              {agent.name}
                            </h4>
                            {isAssigned && (
                              <Badge className="text-xs bg-green-500/20 text-green-400">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Assigned
                              </Badge>
                            )}
                            {agent.status === 'inactive' && (
                              <Badge className="text-xs bg-slate-500/20 text-slate-400">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                            {agent.domain} • {agent.role}
                          </p>
                          {agent.success_rate > 0 && (
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              Success Rate: {agent.success_rate}%
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {selectedAgent && (
            <>
              {/* Assignment Type */}
              <div className="space-y-2">
                <Label style={{ color: 'var(--text-primary)' }}>Assignment Type</Label>
                <Select value={assignmentType} onValueChange={setAssignmentType}>
                  <SelectTrigger style={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                    <SelectItem value="primary" style={{ color: 'var(--text-primary)' }}>
                      Primary - Main agent responsible
                    </SelectItem>
                    <SelectItem value="supporting" style={{ color: 'var(--text-primary)' }}>
                      Supporting - Assists other agents
                    </SelectItem>
                    <SelectItem value="consultant" style={{ color: 'var(--text-primary)' }}>
                      Consultant - Provides expertise as needed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Responsibilities */}
              <div className="space-y-2">
                <Label style={{ color: 'var(--text-primary)' }}>Responsibilities (one per line)</Label>
                <Textarea
                  placeholder="Content creation&#10;Social media management&#10;Analytics reporting"
                  value={responsibilities}
                  onChange={(e) => setResponsibilities(e.target.value)}
                  style={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                  className="h-24"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label style={{ color: 'var(--text-primary)' }}>Notes (Optional)</Label>
                <Textarea
                  placeholder="Any specific instructions or context for this agent..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                  className="h-20"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={!selectedAgent || assignMutation.isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Users className="w-4 h-4 mr-2" />
            Assign Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}