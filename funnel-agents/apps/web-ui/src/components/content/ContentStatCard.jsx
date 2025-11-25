import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function ContentStatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  borderColor, 
  textColor,
  onClick,
  active
}) {
  const trendValue = trend?.value || 0;
  const isPositive = trendValue >= 0;

  return (
    <Card 
      className="p-5 transition-all cursor-pointer group"
      style={{ 
        backgroundColor: 'var(--bg-card)',
        border: active ? `2px solid ${borderColor}` : `1px solid ${borderColor || 'var(--border-subtle)'}`,
        borderRadius: '12px',
        boxShadow: active ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span 
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: textColor || 'var(--text-muted)' }}
        >
          {title}
        </span>
        {Icon && <Icon className="w-4 h-4" style={{ color: textColor || 'var(--text-muted)' }} />}
      </div>
      
      <div className="flex items-end justify-between">
        <div className="text-3xl font-bold" style={{ color: textColor || 'var(--text-primary)' }}>
          {value}
        </div>
        
        {trend && (
          <div className="flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
            <span 
              className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}
            >
              {Math.abs(trendValue)}%
            </span>
          </div>
        )}
      </div>
      
      <p className="text-xs mt-1" style={{ color: textColor ? `${textColor}99` : 'var(--text-muted)' }}>
        {subtitle}
      </p>
      
      {/* Mini sparkline placeholder */}
      {trend && (
        <div className="mt-3 h-8 flex items-end gap-0.5">
          {[40, 60, 45, 70, 55, 75, 65].map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all"
              style={{
                height: `${height}%`,
                backgroundColor: textColor ? `${textColor}40` : 'var(--border-subtle)',
                opacity: 0.6
              }}
            />
          ))}
        </div>
      )}
    </Card>
  );
}