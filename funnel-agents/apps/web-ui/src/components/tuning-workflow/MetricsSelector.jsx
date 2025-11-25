import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Target, TrendingUp, Clock, Award, CheckCircle2 } from 'lucide-react';

export default function MetricsSelector({ targetMetrics, onMetricsChange }) {
  const metrics = [
    {
      key: 'success_rate',
      label: 'Success Rate',
      icon: CheckCircle2,
      description: 'Improve task completion rate',
      color: 'text-green-400',
    },
    {
      key: 'feedback_score',
      label: 'Feedback Score',
      icon: Award,
      description: 'Enhance user satisfaction ratings',
      color: 'text-yellow-400',
    },
    {
      key: 'completion_time',
      label: 'Completion Time',
      icon: Clock,
      description: 'Reduce average task duration',
      color: 'text-blue-400',
    },
    {
      key: 'output_quality',
      label: 'Output Quality',
      icon: TrendingUp,
      description: 'Improve response accuracy and relevance',
      color: 'text-purple-400',
    },
  ];

  const handleToggleMetric = (key) => {
    onMetricsChange({ ...targetMetrics, [key]: !targetMetrics[key] });
  };

  const selectedCount = Object.values(targetMetrics).filter(Boolean).length;

  return (
    <Card className="p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center space-x-2 mb-4">
        <Target className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          Target Metrics to Improve
        </h3>
      </div>

      <div className="space-y-3">
        {metrics.map(metric => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.key}
              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                targetMetrics[metric.key]
                  ? 'border-blue-500/50 bg-blue-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
              onClick={() => handleToggleMetric(metric.key)}
            >
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={targetMetrics[metric.key]}
                  onCheckedChange={() => handleToggleMetric(metric.key)}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon className={`w-4 h-4 ${metric.color}`} />
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {metric.label}
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {metric.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-slate-700 mt-4">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {selectedCount} metric{selectedCount !== 1 ? 's' : ''} selected for optimization
        </p>
      </div>
    </Card>
  );
}