import { Card } from '@/components/ui/card';
import { Target, Users, Activity, Brain } from 'lucide-react';

export default function LeadScoreBreakdown({ score = 0, breakdown = {} }) {
  const components = [
    {
      label: 'ICP Fit',
      value: breakdown.icp_fit || 0,
      max: 40,
      icon: Target,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500'
    },
    {
      label: 'Engagement',
      value: breakdown.engagement || 0,
      max: 30,
      icon: Activity,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500'
    },
    {
      label: 'Recency',
      value: breakdown.recency || 0,
      max: 20,
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-500'
    },
    {
      label: 'AI Confidence',
      value: breakdown.agent_confidence || 0,
      max: 10,
      icon: Brain,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500'
    }
  ];

  return (
    <Card className="bg-black/40 border-slate-800/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-semibold">Lead Score</h3>
        <div className="text-3xl font-bold text-white">{score}</div>
      </div>
      <div className="space-y-4">
        {components.map((component) => {
          const Icon = component.icon;
          const percentage = (component.value / component.max) * 100;
          return (
            <div key={component.label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Icon className={`w-4 h-4 ${component.color}`} />
                  <span className="text-sm text-slate-300">{component.label}</span>
                </div>
                <span className="text-sm text-white">
                  {component.value}/{component.max}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${component.bgColor} rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}