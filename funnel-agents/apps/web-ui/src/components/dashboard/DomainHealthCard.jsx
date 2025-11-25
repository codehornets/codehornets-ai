import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getDomainColor } from '@/components/utils/domainColors';

export default function DomainHealthCard({ domain, agentCount, activeCount, successRate, delay = 0, onClick }) {
  const healthStatus = successRate >= 90 ? 'excellent' : successRate >= 75 ? 'good' : 'warning';
  const needsReview = successRate < 75 && successRate > 0;
  
  const domainColor = getDomainColor(domain);
  
  const statusConfig = {
    excellent: { icon: CheckCircle2 },
    good: { icon: TrendingUp },
    warning: { icon: AlertCircle },
  };

  const Icon = statusConfig[healthStatus].icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card 
        className="p-5 transition-all group cursor-pointer relative"
        onClick={onClick}
        style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: `1px solid ${domainColor.solid}33`,
          borderRadius: '12px'
        }}
      >
        {needsReview && (
          <div className="absolute top-2 right-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
              Needs review
            </span>
          </div>
        )}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{domain}</h4>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{agentCount} agents</p>
          </div>
          <div className={`p-2 rounded-lg ${domainColor.bg}`}>
            <Icon className={`w-4 h-4 ${domainColor.text}`} />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--text-muted)' }}>Active</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{activeCount}/{agentCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--text-muted)' }}>Success Rate</span>
            <span className={`font-medium ${domainColor.text}`}>{successRate}%</span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full overflow-hidden mt-3" style={{ backgroundColor: 'var(--border-subtle)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${successRate}%` }}
              transition={{ duration: 1, delay: delay + 0.2 }}
              className="h-full"
              style={{ backgroundColor: domainColor.solid }}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}