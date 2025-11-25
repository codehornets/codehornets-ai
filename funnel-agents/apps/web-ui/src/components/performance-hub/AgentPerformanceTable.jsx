import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  TrendingUp, TrendingDown, Award, Clock, CheckCircle2, 
  XCircle, Activity, Eye 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function AgentPerformanceTable({ 
  agents, 
  isLoading, 
  selectedAgents = [], 
  onSelectAgent,
  onSelectAll 
}) {
  const navigate = useNavigate();

  const performanceColors = {
    excellent: 'bg-green-500/20 text-green-400 border-green-500/30',
    good: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    average: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    needs_improvement: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading performance data...</p>
      </Card>
    );
  }

  if (agents.length === 0) {
    return (
      <Card className="p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        <Activity className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>No agents match the current filters</p>
      </Card>
    );
  }

  const allSelected = agents.length > 0 && selectedAgents.length === agents.length;

  return (
    <Card className="overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <th className="text-left p-4">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => onSelectAll(checked)}
                />
              </th>
              <th className="text-left p-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Agent
              </th>
              <th className="text-left p-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Performance
              </th>
              <th className="text-center p-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Success Rate
              </th>
              <th className="text-center p-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Tasks
              </th>
              <th className="text-center p-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Feedback
              </th>
              <th className="text-center p-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                30d Success
              </th>
              <th className="text-center p-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Avg Time
              </th>
              <th className="text-center p-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Tuning
              </th>
              <th className="text-right p-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr 
                key={agent.id}
                className="hover:bg-[var(--bg-surface-hover)] transition-colors"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <td className="p-4">
                  <Checkbox
                    checked={selectedAgents.includes(agent.id)}
                    onCheckedChange={() => onSelectAgent(agent.id)}
                  />
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      agent.status === 'active' ? 'bg-green-500/20' : 'bg-slate-500/20'
                    }`}>
                      <Activity className={`w-5 h-5 ${
                        agent.status === 'active' ? 'text-green-400' : 'text-slate-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {agent.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {agent.role}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <Badge className={`text-xs ${performanceColors[agent.performanceLevel]}`}>
                    {agent.performanceLevel.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    {agent.metrics.successRate >= 75 ? (
                      <TrendingUp className="w-3 h-3 text-green-400" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-400" />
                    )}
                    <span className={`font-medium ${
                      agent.metrics.successRate >= 75 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {agent.metrics.successRate.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center space-x-3 text-xs">
                    <span className="flex items-center text-green-400">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {agent.metrics.completedTasks}
                    </span>
                    {agent.metrics.failedTasks > 0 && (
                      <span className="flex items-center text-red-400">
                        <XCircle className="w-3 h-3 mr-1" />
                        {agent.metrics.failedTasks}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-center mt-1" style={{ color: 'var(--text-muted)' }}>
                    {agent.metrics.totalTasks} total
                  </p>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Award className={`w-3 h-3 ${
                      agent.metrics.avgFeedbackRating >= 4 ? 'text-yellow-400' : 'text-slate-400'
                    }`} />
                    <span style={{ color: 'var(--text-primary)' }}>
                      {agent.metrics.avgFeedbackRating > 0 ? agent.metrics.avgFeedbackRating.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    {agent.metrics.recentSuccessRate >= agent.metrics.successRate ? (
                      <TrendingUp className="w-3 h-3 text-green-400" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-orange-400" />
                    )}
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {agent.metrics.recentSuccessRate.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {agent.metrics.recentTasks} tasks
                  </p>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Clock className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {formatTime(agent.metrics.avgCompletionTime)}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="text-xs">
                    <span style={{ color: 'var(--text-primary)' }}>{agent.metrics.tuningCount}</span>
                    {agent.metrics.pendingTuning > 0 && (
                      <Badge className="ml-2 text-xs bg-orange-500/20 text-orange-400">
                        {agent.metrics.pendingTuning} pending
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(createPageUrl('AgentDetail') + `?id=${agent.id}`)}
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}