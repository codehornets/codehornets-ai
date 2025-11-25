import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MetricCard({ title, value, icon: Icon, trend, trendValue, delay = 0, onClick, emptyMessage }) {
  const isZero = value === 0 || value === '0' || value === '0%';
  const showTrend = trend && trendValue && !isZero;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card 
        className={`p-6 transition-all group h-full ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
        style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px'
        }}
      >
        <div className="flex items-start justify-between h-full">
          <div className="flex flex-col">
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{title}</p>
            <h3 className="text-3xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>{isZero ? '–' : value}</h3>
            <div className="mt-auto pt-3">
              {showTrend ? (
                <div className="flex items-center space-x-2">
                  {trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {trendValue}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>vs last week</span>
                </div>
              ) : isZero && emptyMessage ? (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{emptyMessage}</p>
              ) : null}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
            <Icon className="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}