import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function PerformanceChart({ data = [], title = "Performance Over Time", type = "area", tasks = [], showPercentage = false }) {
  // Generate chart data from tasks or use mock data
  const generateChartData = () => {
    if (tasks.length === 0) {
      return [
        { date: 'Jan 8', tasks: 45, success: 42, failed: 3 },
        { date: 'Jan 9', tasks: 52, success: 49, failed: 3 },
        { date: 'Jan 10', tasks: 61, success: 58, failed: 3 },
        { date: 'Jan 11', tasks: 58, success: 54, failed: 4 },
        { date: 'Jan 12', tasks: 70, success: 66, failed: 4 },
        { date: 'Jan 13', tasks: 48, success: 45, failed: 3 },
        { date: 'Jan 14', tasks: 55, success: 52, failed: 3 },
        { date: 'Jan 15', tasks: 63, success: 60, failed: 3 },
      ];
    }
    
    // Group tasks by date
    const tasksByDate = {};
    tasks.forEach(task => {
      const date = new Date(task.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!tasksByDate[date]) {
        tasksByDate[date] = { success: 0, failed: 0 };
      }
      if (task.status === 'completed') tasksByDate[date].success++;
      if (task.status === 'failed') tasksByDate[date].failed++;
    });

    return Object.entries(tasksByDate).map(([date, counts]) => ({
      date,
      tasks: counts.success + counts.failed,
      success: counts.success,
      failed: counts.failed,
      successRate: showPercentage && (counts.success + counts.failed) > 0 
        ? Math.round((counts.success / (counts.success + counts.failed)) * 100) 
        : null
    }));
  };

  const displayData = data.length > 0 ? data : generateChartData();

  const ChartComponent = type === 'line' ? LineChart : AreaChart;
  const DataComponent = type === 'line' ? Line : Area;

  return (
    <Card style={{ 
      backgroundColor: 'var(--bg-card)', 
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px'
    }}>
      <CardHeader style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <CardTitle style={{ color: 'var(--text-primary)' }} className="flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={320}>
          <ChartComponent data={displayData}>
            <defs>
              <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
            <XAxis dataKey="date" stroke="#64748B" style={{ fontSize: '12px' }} />
            <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#F1F5F9',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#94A3B8' }} />
            {type === 'area' ? (
              <>
                <Area
                  type="monotone"
                  dataKey="success"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSuccess)"
                  name="Successful"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFailed)"
                  name="Failed"
                />
              </>
            ) : showPercentage ? (
              <Line
                type="monotone"
                dataKey="successRate"
                stroke="#10B981"
                strokeWidth={2}
                name="Success Rate %"
              />
            ) : (
              <>
                <Line
                  type="monotone"
                  dataKey="tasks"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Total Tasks"
                />
                <Line
                  type="monotone"
                  dataKey="success"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Successful"
                />
              </>
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}