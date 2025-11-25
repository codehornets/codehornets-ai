import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function AgentLeaderboard({ agents = [], tasks = [] }) {
  const navigate = useNavigate();

  // Calculate task stats per agent from actual task data
  const agentStats = agents.map(agent => {
    const agentTasks = tasks.filter(t => t.agent_id === agent.id);
    const completed = agentTasks.filter(t => t.status === 'completed').length;
    const successRate = agentTasks.length > 0 ? Math.round((completed / agentTasks.length) * 100) : 0;
    
    return {
      ...agent,
      taskCount: agentTasks.length,
      completedCount: completed,
      calculatedSuccessRate: successRate
    };
  });

  const sortedAgents = agentStats
    .filter(a => a.taskCount > 0)
    .sort((a, b) => (b.calculatedSuccessRate || 0) - (a.calculatedSuccessRate || 0))
    .slice(0, 10);

  const getRankIcon = (index) => {
    switch(index) {
      case 0: return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 1: return <Medal className="w-5 h-5 text-slate-400" />;
      case 2: return <Award className="w-5 h-5 text-orange-400" />;
      default: return <span className="text-slate-500 font-medium w-5 text-center">{index + 1}</span>;
    }
  };

  return (
    <Card style={{ 
      backgroundColor: 'var(--bg-card)', 
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px'
    }}>
      <CardHeader style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <CardTitle style={{ color: 'var(--text-primary)' }} className="flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
          Top Performing Agents
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div style={{ borderColor: 'var(--border-subtle)' }} className="divide-y">
          {sortedAgents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(createPageUrl('AgentDetail') + `?id=${agent.id}`)}
              className="p-4 transition-colors cursor-pointer group"
              style={{ 
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-8 flex justify-center">
                  {getRankIcon(index)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate group-hover:text-blue-400 transition-colors" style={{ color: 'var(--text-primary)' }}>{agent.name}</p>
                  <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                    <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>{agent.domain}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{agent.taskCount}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tasks</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-semibold">{agent.calculatedSuccessRate}%</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Success Rate</p>
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