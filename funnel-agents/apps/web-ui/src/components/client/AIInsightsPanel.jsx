import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import client from '@/api/client';
import { 
  AlertTriangle, TrendingUp, CheckCircle2, Lightbulb, 
  Sparkles, ChevronRight, Clock, Target, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import FeedbackButton from '../feedback/FeedbackButton';

export default function AIInsightsPanel({ clientId, workspace }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const response = await client.functions.invoke('generateClientInsights', { client_id: clientId });
      setInsights(response.data);
      toast.success('AI insights generated');
    } catch (error) {
      console.error('Failed to generate insights:', error);
      toast.error('Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const severityColors = {
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const effortColors = {
    low: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-red-500/20 text-red-400',
  };

  const priorityColors = {
    low: 'bg-slate-500/20 text-slate-400',
    medium: 'bg-blue-500/20 text-blue-400',
    high: 'bg-orange-500/20 text-orange-400',
    urgent: 'bg-red-500/20 text-red-400',
  };

  if (!insights) {
    return (
      <Card className="p-8 text-center" style={{ 
        backgroundColor: 'var(--bg-card)', 
        border: '1px solid var(--border-subtle)' 
      }}>
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-400" />
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          AI-Powered Insights
        </h3>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Get proactive analysis of {workspace?.name}'s progress, identify issues, and discover opportunities
        </p>
        <Button 
          onClick={generateInsights}
          disabled={loading}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Insights
            </>
          )}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            AI Insights
          </h3>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Generated {insights.analysis?.generated_at ? new Date(insights.analysis.generated_at).toLocaleString() : 'recently'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <FeedbackButton
            clientId={clientId}
            feedbackType="agent_insight"
            relatedId={clientId}
            title="Rate AI Insights"
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={generateInsights}
            disabled={loading}
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <RefreshCw className={`w-3 h-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary */}
      {insights.analysis?.summary && (
        <Card className="p-4" style={{ 
          backgroundColor: 'var(--bg-surface)', 
          border: '1px solid var(--border-subtle)' 
        }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {insights.analysis.summary}
          </p>
        </Card>
      )}

      {/* Issues */}
      {insights.analysis?.issues?.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Issues & Blockers
            </h4>
          </div>
          <div className="space-y-2">
            {insights.analysis.issues.map((issue, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-4" style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  border: '1px solid var(--border-subtle)' 
                }}>
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {issue.title}
                    </h5>
                    <Badge className={`text-xs ${severityColors[issue.severity]}`}>
                      {issue.severity}
                    </Badge>
                  </div>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {issue.description}
                  </p>
                  <div className="flex items-start space-x-2 text-xs p-2 rounded" style={{ backgroundColor: 'var(--bg-surface)' }}>
                    <CheckCircle2 className="w-3 h-3 mt-0.5 text-blue-400 flex-shrink-0" />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {issue.action_required}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Opportunities */}
      {insights.analysis?.opportunities?.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Growth Opportunities
            </h4>
          </div>
          <div className="space-y-2">
            {insights.analysis.opportunities.map((opp, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-4 hover:border-green-500/30 transition-all cursor-pointer" style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  border: '1px solid var(--border-subtle)' 
                }}>
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {opp.title}
                    </h5>
                    <Badge className={`text-xs ${effortColors[opp.effort]}`}>
                      {opp.effort} effort
                    </Badge>
                  </div>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {opp.description}
                  </p>
                  <div className="flex items-center space-x-1 text-xs text-green-400">
                    <Target className="w-3 h-3" />
                    <span>{opp.potential_impact}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Next Actions */}
      {insights.analysis?.next_actions?.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Recommended Next Steps
            </h4>
          </div>
          <div className="space-y-2">
            {insights.analysis.next_actions.map((action, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-4 hover:border-blue-500/30 transition-all cursor-pointer" style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  border: '1px solid var(--border-subtle)' 
                }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start space-x-2 flex-1">
                      <ChevronRight className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {action.action}
                      </p>
                    </div>
                    <Badge className={`text-xs ${priorityColors[action.priority]} ml-2`}>
                      {action.priority}
                    </Badge>
                  </div>
                  <div className="ml-6 space-y-1">
                    <div className="flex items-center space-x-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Clock className="w-3 h-3" />
                      <span>{action.estimated_time}</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {action.expected_outcome}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Ideas */}
      {insights.analysis?.campaign_ideas?.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Campaign Ideas
            </h4>
          </div>
          <div className="space-y-2">
            {insights.analysis.campaign_ideas.map((idea, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-4 hover:border-purple-500/30 transition-all cursor-pointer" style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  border: '1px solid var(--border-subtle)' 
                }}>
                  <h5 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                    {idea.name}
                  </h5>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {idea.description}
                  </p>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Objective: </span>
                      <span style={{ color: 'var(--text-secondary)' }}>{idea.objective}</span>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Audience: </span>
                      <span style={{ color: 'var(--text-secondary)' }}>{idea.target_audience}</span>
                    </div>
                    {idea.key_channels?.length > 0 && (
                      <div className="flex items-center space-x-1 flex-wrap gap-1">
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Channels: </span>
                        {idea.key_channels.map((channel, i) => (
                          <Badge key={i} variant="outline" className="text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}