import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import client from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { 
  AlertTriangle, Lightbulb, TrendingUp, ArrowRight, 
  Sparkles, RefreshCw, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function AIProactiveInsights() {
  const [dismissed, setDismissed] = useState([]);
  const [globalInsights, setGlobalInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => client.entities.Workspace.list(),
    initialData: [],
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => client.entities.Campaign.list(),
    initialData: [],
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => client.entities.Task.list('-created_date', 200),
    initialData: [],
  });

  useEffect(() => {
    // Auto-generate insights on mount
    if (workspaces.length > 0) {
      analyzeSystem();
    }
  }, [workspaces.length]);

  const analyzeSystem = async () => {
    setLoading(true);
    try {
      // Calculate system-wide metrics
      const totalTasks = tasks.length;
      const failedTasks = tasks.filter(t => t.status === 'failed').length;
      const stalledTasks = tasks.filter(t => {
        if (t.status !== 'running') return false;
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        return new Date(t.created_date).getTime() < dayAgo;
      }).length;

      const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
      const stalledCampaigns = campaigns.filter(c => {
        if (c.status !== 'active') return false;
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return (c.progress || 0) < 10 && new Date(c.created_date).getTime() < weekAgo;
      }).length;

      const clientsWithNoActivity = workspaces.filter(ws => {
        const clientTasks = tasks.filter(t => t.client_id === ws.id);
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentTasks = clientTasks.filter(t => new Date(t.created_date).getTime() > weekAgo);
        return recentTasks.length === 0;
      }).length;

      // Generate proactive insights
      const insights = [];

      if (failedTasks > 3) {
        insights.push({
          id: 'failed-tasks',
          type: 'issue',
          title: `${failedTasks} failed tasks need attention`,
          description: 'Review and retry failed tasks to maintain quality standards',
          action: 'Review Failed Tasks',
          actionUrl: createPageUrl('Tasks') + '?status=failed',
          severity: 'high'
        });
      }

      if (stalledTasks > 2) {
        insights.push({
          id: 'stalled-tasks',
          type: 'issue',
          title: `${stalledTasks} tasks running for over 24 hours`,
          description: 'Long-running tasks may need intervention or cancellation',
          action: 'Check Long Tasks',
          actionUrl: createPageUrl('Tasks') + '?status=running',
          severity: 'medium'
        });
      }

      if (stalledCampaigns > 0) {
        insights.push({
          id: 'stalled-campaigns',
          type: 'opportunity',
          title: `${stalledCampaigns} campaigns with minimal progress`,
          description: 'Kickstart these campaigns with new tasks or automation',
          action: 'View Campaigns',
          actionUrl: createPageUrl('Projects'),
          impact: 'high'
        });
      }

      if (clientsWithNoActivity > 0) {
        insights.push({
          id: 'inactive-clients',
          type: 'opportunity',
          title: `${clientsWithNoActivity} clients with no activity this week`,
          description: 'Re-engage dormant clients with check-ins or new initiatives',
          action: 'View Clients',
          actionUrl: createPageUrl('Workspaces'),
          impact: 'medium'
        });
      }

      if (activeCampaigns > 5) {
        insights.push({
          id: 'high-workload',
          type: 'suggestion',
          title: 'High number of active campaigns',
          description: 'Consider prioritizing or automating routine tasks',
          action: 'View Automations',
          actionUrl: createPageUrl('Workflows'),
          impact: 'low'
        });
      }

      setGlobalInsights(insights.filter(i => !dismissed.includes(i.id)));
    } catch (error) {
      console.error('Failed to analyze system:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (insightId) => {
    setDismissed([...dismissed, insightId]);
    setGlobalInsights(globalInsights.filter(i => i.id !== insightId));
  };

  if (!globalInsights || globalInsights.length === 0) {
    return null;
  }

  const getIcon = (type) => {
    if (type === 'issue') return AlertTriangle;
    if (type === 'opportunity') return TrendingUp;
    return Lightbulb;
  };

  const getColors = (insight) => {
    if (insight.type === 'issue') {
      return insight.severity === 'high' 
        ? 'border-red-500/30 bg-red-500/5'
        : 'border-orange-500/30 bg-orange-500/5';
    }
    if (insight.type === 'opportunity') {
      return 'border-green-500/30 bg-green-500/5';
    }
    return 'border-blue-500/30 bg-blue-500/5';
  };

  const getTextColor = (insight) => {
    if (insight.type === 'issue') {
      return insight.severity === 'high' ? 'text-red-400' : 'text-orange-400';
    }
    if (insight.type === 'opportunity') return 'text-green-400';
    return 'text-blue-400';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            AI Insights
          </h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={analyzeSystem}
          disabled={loading}
          style={{ color: 'var(--text-secondary)' }}
        >
          <RefreshCw className={`w-3 h-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <AnimatePresence>
        {globalInsights.map((insight, idx) => {
          const Icon = getIcon(insight.type);
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card 
                className={`p-4 border ${getColors(insight)}`}
                style={{ backgroundColor: 'var(--bg-card)' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start space-x-3 flex-1">
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getTextColor(insight)}`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                        {insight.title}
                      </h4>
                      <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                        {insight.description}
                      </p>
                      <Link to={insight.actionUrl}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={`text-xs ${getTextColor(insight)}`}
                          style={{ borderColor: 'var(--border-subtle)' }}
                        >
                          {insight.action}
                          <ArrowRight className="w-3 h-3 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => handleDismiss(insight.id)}
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}