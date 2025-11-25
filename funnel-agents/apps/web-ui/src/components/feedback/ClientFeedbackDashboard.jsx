import { useState } from 'react';
import client from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, MessageSquare, 
  ThumbsUp, Target, CheckCircle2, Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ClientFeedbackDashboard({ clientId }) {
  const [filter, setFilter] = useState('all');

  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ['client-feedback', clientId],
    queryFn: async () => {
      const all = await client.entities.ClientFeedback.list('-created_date', 100);
      return all.filter(f => f.client_id === clientId);
    },
    initialData: [],
  });

  const filteredFeedback = filter === 'all' 
    ? feedback 
    : feedback.filter(f => f.feedback_type === filter);

  // Calculate metrics
  const avgRating = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : 0;

  const avgUsefulness = feedback.filter(f => f.usefulness_score > 0).length > 0
    ? (feedback.filter(f => f.usefulness_score > 0).reduce((sum, f) => sum + f.usefulness_score, 0) / 
       feedback.filter(f => f.usefulness_score > 0).length).toFixed(1)
    : 0;

  const avgAccuracy = feedback.filter(f => f.accuracy_score > 0).length > 0
    ? (feedback.filter(f => f.accuracy_score > 0).reduce((sum, f) => sum + f.accuracy_score, 0) / 
       feedback.filter(f => f.accuracy_score > 0).length).toFixed(1)
    : 0;

  const actedUponCount = feedback.filter(f => f.acted_upon).length;
  const actedUponRate = feedback.length > 0
    ? Math.round((actedUponCount / feedback.length) * 100)
    : 0;

  const getTypeLabel = (type) => {
    const labels = {
      ai_report: 'AI Report',
      campaign_suggestion: 'Campaign Idea',
      agent_insight: 'Agent Insight',
      onboarding_analysis: 'Onboarding',
      task_output: 'Task Output',
      general: 'General'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      ai_report: 'bg-blue-500/20 text-blue-400',
      campaign_suggestion: 'bg-purple-500/20 text-purple-400',
      agent_insight: 'bg-green-500/20 text-green-400',
      onboarding_analysis: 'bg-yellow-500/20 text-yellow-400',
      task_output: 'bg-orange-500/20 text-orange-400',
      general: 'bg-slate-500/20 text-slate-400'
    };
    return colors[type] || colors.general;
  };

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
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4" style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-subtle)' 
        }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Avg Rating</span>
            <Star className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {avgRating}/5
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            From {feedback.length} reviews
          </p>
        </Card>

        <Card className="p-4" style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-subtle)' 
        }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Usefulness</span>
            <Target className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {avgUsefulness}/5
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            How helpful
          </p>
        </Card>

        <Card className="p-4" style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-subtle)' 
        }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Accuracy</span>
            <Activity className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {avgAccuracy}/5
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            How accurate
          </p>
        </Card>

        <Card className="p-4" style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-subtle)' 
        }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Action Rate</span>
            <ThumbsUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {actedUponRate}%
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {actedUponCount} acted upon
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2 overflow-x-auto">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-blue-600' : ''}
        >
          All ({feedback.length})
        </Button>
        {['ai_report', 'campaign_suggestion', 'agent_insight', 'task_output'].map(type => {
          const count = feedback.filter(f => f.feedback_type === type).length;
          if (count === 0) return null;
          return (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(type)}
              className={filter === type ? 'bg-blue-600' : ''}
            >
              {getTypeLabel(type)} ({count})
            </Button>
          );
        })}
      </div>

      {/* Feedback List */}
      {filteredFeedback.length === 0 ? (
        <Card className="p-12 text-center" style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-subtle)' 
        }}>
          <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>
            No feedback yet
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredFeedback.map((item) => (
            <Card key={item.id} className="p-4" style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-subtle)' 
            }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Badge className={`text-xs ${getTypeColor(item.feedback_type)}`}>
                    {getTypeLabel(item.feedback_type)}
                  </Badge>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < item.rating 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  {item.acted_upon && (
                    <Badge className="text-xs bg-green-500/20 text-green-400">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Acted Upon
                    </Badge>
                  )}
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatDistanceToNow(new Date(item.created_date), { addSuffix: true })}
                </span>
              </div>

              {/* Scores */}
              {(item.usefulness_score > 0 || item.accuracy_score > 0 || item.actionability_score > 0) && (
                <div className="flex items-center space-x-4 mb-3 text-xs">
                  {item.usefulness_score > 0 && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Usefulness: {item.usefulness_score}/5
                    </span>
                  )}
                  {item.accuracy_score > 0 && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Accuracy: {item.accuracy_score}/5
                    </span>
                  )}
                  {item.actionability_score > 0 && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Actionability: {item.actionability_score}/5
                    </span>
                  )}
                </div>
              )}

              {/* Comments */}
              {item.comment && (
                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {item.comment}
                </p>
              )}

              {item.what_worked && (
                <div className="text-xs mb-2 p-2 rounded" style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <span className="font-semibold text-green-400">What worked: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.what_worked}</span>
                </div>
              )}

              {item.what_missed && (
                <div className="text-xs mb-2 p-2 rounded" style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <span className="font-semibold text-orange-400">What missed: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.what_missed}</span>
                </div>
              )}

              {item.improvement_suggestions && (
                <div className="text-xs mb-2 p-2 rounded" style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <span className="font-semibold text-blue-400">Suggestions: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.improvement_suggestions}</span>
                </div>
              )}

              {item.outcome && (
                <div className="text-xs p-2 rounded" style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <span className="font-semibold text-purple-400">Outcome: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.outcome}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}