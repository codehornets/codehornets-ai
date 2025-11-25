import { useState } from 'react';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, X, MoreVertical, TrendingUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import AssignAgentModal from './AssignAgentModal';

export default function ClientAgentTeam({ clientId, campaignId = null }) {
  const queryClient = useQueryClient();
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['agent-assignments', clientId, campaignId],
    queryFn: async () => {
      const all = await client.entities.AgentAssignment.list();
      return all.filter(a => 
        a.client_id === clientId && 
        a.status === 'active' &&
        (!campaignId || a.campaign_id === campaignId)
      );
    },
    initialData: [],
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => client.entities.Agent.list(),
    initialData: [],
  });

  const removeMutation = useMutation({
    mutationFn: (assignmentId) => 
      client.entities.AgentAssignment.update(assignmentId, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-assignments'] });
      toast.success('Agent unassigned');
    },
  });

  const getTypeColor = (type) => {
    switch(type) {
      case 'primary': return 'bg-blue-500/20 text-blue-400';
      case 'supporting': return 'bg-purple-500/20 text-purple-400';
      case 'consultant': return 'bg-green-500/20 text-green-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6" style={{ 
        backgroundColor: 'var(--bg-card)', 
        border: '1px solid var(--border-subtle)' 
      }}>
        <div className="animate-pulse space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-700/30 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6" style={{ 
        backgroundColor: 'var(--bg-card)', 
        border: '1px solid var(--border-subtle)' 
      }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Assigned Agents
            </h3>
            <Badge className="bg-blue-500/20 text-blue-400">
              {assignments.length}
            </Badge>
          </div>
          <Button
            size="sm"
            onClick={() => setAssignModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Assign Agent
          </Button>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              No agents assigned yet
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAssignModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Assign First Agent
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => {
              const agent = agents.find(a => a.id === assignment.agent_id);

              return (
                <div
                  key={assignment.id}
                  className="p-4 rounded-lg border transition-all hover:shadow-md"
                  style={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    border: '1px solid var(--border-subtle)' 
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {assignment.agent_name}
                        </h4>
                        <Badge className={`text-xs ${getTypeColor(assignment.assignment_type)}`}>
                          {assignment.assignment_type}
                        </Badge>
                        {agent?.success_rate > 0 && (
                          <span className="text-xs flex items-center" style={{ color: 'var(--text-muted)' }}>
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {agent.success_rate}%
                          </span>
                        )}
                      </div>

                      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                        {assignment.agent_domain} • {assignment.agent_role}
                      </p>

                      {assignment.responsibilities?.length > 0 && (
                        <div className="space-y-1 mb-2">
                          {assignment.responsibilities.map((resp, idx) => (
                            <div key={idx} className="flex items-start space-x-2 text-xs">
                              <span style={{ color: 'var(--text-muted)' }}>•</span>
                              <span style={{ color: 'var(--text-secondary)' }}>{resp}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {assignment.notes && (
                        <p className="text-xs italic mt-2" style={{ 
                          color: 'var(--text-muted)',
                          borderLeft: '2px solid var(--border-subtle)',
                          paddingLeft: '8px'
                        }}>
                          {assignment.notes}
                        </p>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" style={{ 
                        backgroundColor: 'var(--bg-card)', 
                        border: '1px solid var(--border-subtle)' 
                      }}>
                        <DropdownMenuItem
                          onClick={() => removeMutation.mutate(assignment.id)}
                          className="text-red-400 focus:text-red-400"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Unassign
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <AssignAgentModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        clientId={clientId}
        campaignId={campaignId}
      />
    </>
  );
}