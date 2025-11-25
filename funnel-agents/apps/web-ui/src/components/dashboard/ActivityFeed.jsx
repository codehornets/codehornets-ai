import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Activity, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function ActivityFeed({ activities = [], title = "Real-Time Activity Feed" }) {
  const navigate = useNavigate();
  
  const getIcon = (type) => {
    switch (type) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'started':
        return <Zap className="w-4 h-4 text-blue-400" />;
      default:
        return <Clock className="w-4 h-4 text-amber-400" />;
    }
  };

  // Mock data if empty
  const displayActivities = activities.length > 0 ? activities : [
    { id: 1, type: 'completed', agent: 'Content Creator', action: 'Generated blog post', time: new Date(Date.now() - 5 * 60000), client: 'Marketing Team' },
    { id: 2, type: 'started', agent: 'SEO Specialist', action: 'Analyzing keywords', time: new Date(Date.now() - 12 * 60000), client: 'ACME Corp' },
    { id: 3, type: 'completed', agent: 'Lead Qualifier', action: 'Scored 15 new leads', time: new Date(Date.now() - 25 * 60000), client: 'Tech Startup' },
    { id: 4, type: 'failed', agent: 'Email Marketer', action: 'Campaign send failed', time: new Date(Date.now() - 38 * 60000), client: 'Sales Dept' },
    { id: 5, type: 'completed', agent: 'Social Media Manager', action: 'Posted to LinkedIn', time: new Date(Date.now() - 45 * 60000), client: 'Marketing Team' },
  ];

  return (
    <Card className="h-full flex flex-col" style={{ 
      backgroundColor: 'var(--bg-card)', 
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px'
    }}>
      <CardHeader style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <CardTitle className="flex items-center" style={{ color: 'var(--text-primary)' }}>
          <Activity className="w-5 h-5 mr-2 text-blue-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto">
        <div style={{ borderColor: 'var(--border-subtle)' }} className="divide-y">
          {displayActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 transition-colors cursor-pointer hover:bg-[var(--bg-surface-hover)]"
              onClick={() => navigate(createPageUrl('Tasks'))}
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">{getIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{activity.agent}</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{activity.action}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {activity.client && (
                      <>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>for {activity.client}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>•</span>
                      </>
                    )}
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatDistanceToNow(activity.time, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}