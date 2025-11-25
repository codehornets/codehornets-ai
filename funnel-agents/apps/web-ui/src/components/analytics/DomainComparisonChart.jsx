import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function DomainComparisonChart({ agents = [], tasks = [] }) {
  const domains = [
    'Offer', 'Marketing', 'Sales', 'Fulfillment', 'Feedback Loop',
    'Operations', 'Customer Support', 'Leadership', 'Innovation', 'Enablement'
  ];

  const domainData = domains.map(domain => {
    const domainAgents = agents.filter(a => a.domain === domain);
    const domainTasks = tasks.filter(t => {
      const agent = agents.find(a => a.id === t.agent_id);
      return agent?.domain === domain;
    });
    const completedTasks = domainTasks.filter(t => t.status === 'completed').length;
    const avgSuccessRate = domainTasks.length > 0
      ? Math.round((completedTasks / domainTasks.length) * 100)
      : 0;
    const avgTime = domainTasks.filter(t => t.duration).length > 0
      ? Math.round(domainTasks.filter(t => t.duration).reduce((sum, t) => sum + t.duration, 0) / domainTasks.filter(t => t.duration).length / 60)
      : 0;

    return {
      domain,
      successRate: avgSuccessRate,
      agentCount: domainAgents.filter(a => a.status === 'active').length,
      taskCount: domainTasks.length,
      avgTime: avgTime
    };
  }).filter(d => d.taskCount > 0);

  return (
    <Card style={{ 
      backgroundColor: 'var(--bg-card)', 
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px'
    }}>
      <CardHeader style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <CardTitle style={{ color: 'var(--text-primary)' }} className="flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-400" />
          Domain Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {domainData.length === 0 ? (
            <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>No domain data available yet</p>
          ) : (
            <div className="space-y-2">
              {domainData.map((domain) => (
                <div 
                  key={domain.domain} 
                  className="p-3 rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--bg-surface)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface)'}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{domain.domain}</span>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{domain.agentCount} active agents</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Success Rate</p>
                      <p className={`font-semibold ${
                        domain.successRate >= 90 ? 'text-green-400' : 
                        domain.successRate >= 70 ? 'text-yellow-400' : 
                        'text-red-400'
                      }`}>
                        {domain.successRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Time</p>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{domain.avgTime}m</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tasks</p>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{domain.taskCount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}