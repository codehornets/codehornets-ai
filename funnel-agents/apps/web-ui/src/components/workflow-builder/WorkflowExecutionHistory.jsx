import { useQuery } from '@tanstack/react-query';
import client from '@/api/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function WorkflowExecutionHistory({ workflowId }) {
  const { data: executions = [], isLoading } = useQuery({
    queryKey: ['workflow-executions', workflowId],
    queryFn: async () => {
      try {
        return await client.get(`/api/automations/workflow-runs?workflow_id=${workflowId}&sort=-created_date&limit=20`) || [];
      } catch (err) {
        console.error('Failed to fetch workflow executions:', err);
        return [];
      }
    },
    enabled: !!workflowId,
  });

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-slate-800/30 rounded-lg" />;
  }

  const statusConfig = {
    running: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/20', spin: true },
    completed: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/20' },
    failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
    cancelled: { icon: XCircle, color: 'text-slate-400', bg: 'bg-slate-500/20' },
  };

  return (
    <Card className="p-6" style={{ 
      backgroundColor: 'var(--bg-card)', 
      border: '1px solid var(--border-subtle)' 
    }}>
      <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Execution History
      </h3>
      
      {executions.length === 0 ? (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
          No executions yet
        </p>
      ) : (
        <div className="space-y-2">
          {executions.map((execution) => {
            const config = statusConfig[execution.status];
            const Icon = config.icon;
            
            return (
              <div
                key={execution.id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'var(--bg-surface)' }}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${config.color} ${config.spin ? 'animate-spin' : ''}`} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {execution.trigger_type.replace('_', ' ')}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatDistanceToNow(new Date(execution.started_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {execution.duration && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {execution.duration.toFixed(1)}s
                    </span>
                  )}
                  <Badge className={`text-xs ${config.bg} ${config.color}`}>
                    {execution.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}