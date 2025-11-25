import { useState } from 'react';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, AlertTriangle, TrendingUp, Lightbulb, 
  ArrowRight, CheckCircle2, X, ExternalLink 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function AgentCollaborationFeed({ clientId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: collaborations = [], isLoading } = useQuery({
    queryKey: ['agent-collaborations', clientId],
    queryFn: async () => {
      const all = await client.entities.AgentCollaboration.list('-created_date', 50);
      return all.filter(c => c.client_id === clientId);
    },
    initialData: [],
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async ({ id, action }) => {
      const user = await client.auth.me();
      return client.entities.AgentCollaboration.update(id, {
        status: action === 'acknowledge' ? 'acknowledged' : 'dismissed',
        acknowledged_by: user.email,
        acknowledged_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-collaborations'] });
      toast.success('Status updated');
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (collaboration) => {
      const task = await client.entities.Task.create({
        title: collaboration.title,
        description: collaboration.message,
        client_id: clientId,
        campaign_id: collaboration.related_campaign_id,
        agent_id: collaboration.initiating_agent_id,
        agent_name: collaboration.initiating_agent_name,
        priority: collaboration.priority === 'critical' ? 'urgent' : collaboration.priority,
        status: 'pending',
        task_type: 'general',
      });

      await client.entities.AgentCollaboration.update(collaboration.id, {
        related_task_id: task.id,
        status: 'acted_upon',
      });

      return task;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['agent-collaborations'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created from collaboration');
      navigate(createPageUrl('Tasks') + `?taskId=${task.id}`);
    },
  });

  const getIcon = (type) => {
    switch(type) {
      case 'issue_alert': return AlertTriangle;
      case 'opportunity_identified': return TrendingUp;
      case 'strategy_suggestion': return Lightbulb;
      case 'cross_functional': return Users;
      default: return Users;
    }
  };

  const getColor = (type) => {
    switch(type) {
      case 'issue_alert': return 'text-red-400 bg-red-500/10';
      case 'opportunity_identified': return 'text-green-400 bg-green-500/10';
      case 'strategy_suggestion': return 'text-purple-400 bg-purple-500/10';
      case 'cross_functional': return 'text-blue-400 bg-blue-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  const filteredCollaborations = filter === 'all' 
    ? collaborations 
    : collaborations.filter(c => c.status === filter);

  if (isLoading) {
    return (
      <Card className="p-6" style={{ 
        backgroundColor: 'var(--bg-card)', 
        border: '1px solid var(--border-subtle)' 
      }}>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-700/30 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
            Agent Collaborations
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            AI agents working together to identify insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-blue-600' : ''}
          >
            All
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
            className={filter === 'pending' ? 'bg-blue-600' : ''}
          >
            Pending
          </Button>
          <Button
            variant={filter === 'acknowledged' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('acknowledged')}
            className={filter === 'acknowledged' ? 'bg-blue-600' : ''}
          >
            Reviewed
          </Button>
        </div>
      </div>

      {/* Collaborations List */}
      {filteredCollaborations.length === 0 ? (
        <Card className="p-12 text-center" style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-subtle)' 
        }}>
          <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>
            No agent collaborations yet
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredCollaborations.map((collab) => {
              const Icon = getIcon(collab.collaboration_type);
              const colorClass = getColor(collab.collaboration_type);

              return (
                <motion.div
                  key={collab.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                >
                  <Card className="p-4 hover:shadow-lg transition-all" style={{ 
                    backgroundColor: 'var(--bg-card)', 
                    border: collab.priority === 'critical' ? '2px solid #ef4444' : '1px solid var(--border-subtle)'
                  }}>
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                {collab.title}
                              </h4>
                              <Badge className={`text-xs ${getPriorityColor(collab.priority)}`}>
                                {collab.priority}
                              </Badge>
                              {collab.status === 'acted_upon' && (
                                <Badge className="text-xs bg-green-500/20 text-green-400">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Acted
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                              {collab.initiating_agent_name}
                              {collab.collaborating_agent_ids?.length > 0 && 
                                ` + ${collab.collaborating_agent_ids.length} other agent${collab.collaborating_agent_ids.length > 1 ? 's' : ''}`
                              }
                              {' • '}
                              {formatDistanceToNow(new Date(collab.created_date), { addSuffix: true })}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                          {collab.message}
                        </p>

                        {/* Findings */}
                        {collab.findings && Object.keys(collab.findings).length > 0 && (
                          <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
                            {collab.findings.issue && (
                              <div className="mb-2">
                                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Issue: </span>
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{collab.findings.issue}</span>
                              </div>
                            )}
                            {collab.findings.impact && (
                              <div className="mb-2">
                                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Impact: </span>
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{collab.findings.impact}</span>
                              </div>
                            )}
                            {collab.findings.recommended_action && (
                              <div>
                                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Recommended: </span>
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{collab.findings.recommended_action}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        {collab.status === 'pending' && (
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              onClick={() => createTaskMutation.mutate(collab)}
                              disabled={createTaskMutation.isLoading}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Create Task
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeMutation.mutate({ id: collab.id, action: 'acknowledge' })}
                              disabled={acknowledgeMutation.isLoading}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Acknowledge
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => acknowledgeMutation.mutate({ id: collab.id, action: 'dismiss' })}
                              disabled={acknowledgeMutation.isLoading}
                            >
                              <X className="w-3 h-3 mr-1" />
                              Dismiss
                            </Button>
                          </div>
                        )}

                        {collab.related_task_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(createPageUrl('Tasks') + `?taskId=${collab.related_task_id}`)}
                          >
                            View Task
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}