import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function TaskTrendsChart({ data = [], title = "Task Completion Trends (7 Days)" }) {
  // Mock data if empty
  const displayData = data.length > 0 ? data : [
    { day: 'Mon', completed: 45, failed: 3 },
    { day: 'Tue', completed: 52, failed: 5 },
    { day: 'Wed', completed: 61, failed: 2 },
    { day: 'Thu', completed: 58, failed: 4 },
    { day: 'Fri', completed: 70, failed: 3 },
    { day: 'Sat', completed: 48, failed: 2 },
    { day: 'Sun', completed: 55, failed: 1 },
  ];

  return (
    <Card className="h-full flex flex-col" style={{ 
      backgroundColor: 'var(--bg-card)', 
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px'
    }}>
      <CardHeader style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <CardTitle className="flex items-center" style={{ color: 'var(--text-primary)' }}>
          <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 flex-1">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={displayData}>
            <defs>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
            <XAxis dataKey="day" stroke="#64748B" style={{ fontSize: '12px' }} />
            <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#F1F5F9',
              }}
            />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCompleted)"
            />
            <Area
              type="monotone"
              dataKey="failed"
              stroke="#EF4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorFailed)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}