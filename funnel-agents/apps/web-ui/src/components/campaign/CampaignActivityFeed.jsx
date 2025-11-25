import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, PlayCircle, FileText, User, Bot, GitBranch } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CampaignActivityFeed({ activities = [] }) {
  const getActivityIcon = (type) => {
    switch(type) {
      case 'task_completed': return CheckCircle2;
      case 'task_failed': return XCircle;
      case 'task_created': return PlayCircle;
      case 'content_attached': return FileText;
      case 'workflow_run': return GitBranch;
      default: return PlayCircle;
    }
  };

  const getActivityColor = (type) => {
    switch(type) {
      case 'task_completed': return 'text-green-500 bg-green-50';
      case 'task_failed': return 'text-red-500 bg-red-50';
      case 'task_created': return 'text-blue-500 bg-blue-50';
      case 'content_attached': return 'text-purple-500 bg-purple-50';
      case 'workflow_run': return 'text-orange-500 bg-orange-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  // Mock activities if none provided
  const displayActivities = activities.length > 0 ? activities : [
    {
      id: '1',
      type: 'task_completed',
      title: 'LinkedIn post draft completed',
      actor: 'Content Writer Agent',
      actor_type: 'ai',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    },
    {
      id: '2',
      type: 'content_attached',
      title: 'New ad creative added',
      actor: 'John Doe',
      actor_type: 'human',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString()
    },
    {
      id: '3',
      type: 'task_created',
      title: 'Research competitor ads',
      actor: 'Sarah Smith',
      actor_type: 'human',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
    }
  ];

  return (
    <Card style={{ 
      backgroundColor: 'var(--bg-card)', 
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px',
      padding: '20px'
    }}>
      <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Recent Activity
      </h3>
      
      <div className="space-y-4">
        {displayActivities.map((activity, idx) => {
          const Icon = getActivityIcon(activity.type);
          const colorClasses = getActivityColor(activity.type);
          
          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClasses}`}>
                <Icon className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {activity.title}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center space-x-1">
                    {activity.actor_type === 'ai' ? (
                      <Bot className="w-3 h-3 text-blue-500" />
                    ) : (
                      <User className="w-3 h-3 text-slate-400" />
                    )}
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {activity.actor}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}