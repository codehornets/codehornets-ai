import { Card } from '@/components/ui/card';
import { Bot, User, Mail, Phone, FileText, Star, TrendingUp, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

export default function LeadTimeline({ activities = [] }) {
  const getIcon = (type) => {
    switch (type) {
      case 'ai_action':
        return <Bot className="w-4 h-4 text-blue-400" />;
      case 'email_sent':
        return <Mail className="w-4 h-4 text-purple-400" />;
      case 'call_logged':
        return <Phone className="w-4 h-4 text-green-400" />;
      case 'note_added':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'score_updated':
        return <Star className="w-4 h-4 text-yellow-400" />;
      case 'status_change':
        return <TrendingUp className="w-4 h-4 text-cyan-400" />;
      case 'task_created':
        return <Zap className="w-4 h-4 text-orange-400" />;
      default:
        return <User className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActorColor = (actorType) => {
    return actorType === 'ai' ? 'text-blue-400' : 'text-slate-300';
  };

  if (activities.length === 0) {
    return (
      <Card className="bg-black/40 border-slate-800/50 p-6">
        <p className="text-slate-400 text-center">No activity yet</p>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-slate-800/50 p-6">
      <h3 className="text-white font-semibold mb-4">Engagement Timeline</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex space-x-3"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
              {getIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{activity.title}</p>
                  {activity.description && (
                    <p className="text-slate-400 text-sm mt-1">{activity.description}</p>
                  )}
                  <div className="flex items-center space-x-2 mt-2 text-xs">
                    <span className={getActorColor(activity.actor_type)}>
                      {activity.actor}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-500">
                      {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}