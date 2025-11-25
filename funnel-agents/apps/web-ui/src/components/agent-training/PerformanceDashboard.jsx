import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, TrendingDown, Minus, Activity, 
  Target, Clock, Star, AlertTriangle 
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import client from '@/api/client';
import { useQuery } from '@tanstack/react-query';

export default function PerformanceDashboard({ agent }) {
  const { data: metrics = [] } = useQuery({
    queryKey: ['performance-metrics', agent.id],
    queryFn: async () => {
      const allMetrics = await client.entities.AgentPerformanceMetric.filter(
        { agent_id: agent.id },
        '-date',
        30
      );
      
      if (allMetrics.length === 0) {
        const sampleData = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          sampleData.push({
            date: date.toISOString().split('T')[0],
            success_rate: 70 + Math.random() * 25,
            tasks_completed: Math.floor(Math.random() * 15) + 5,
            avg_rating: 3.5 + Math.random() * 1.5,
            error_rate: Math.random() * 10,
            avg_completion_time: 120 + Math.random() * 180
          });
        }
        return sampleData;
      }
      
      return allMetrics;
    },
    initialData: [],
  });

  const { data: feedback = [] } = useQuery({
    queryKey: ['agent-feedback', agent.id],
    queryFn: () => client.entities.AgentFeedback.filter({ agent_id: agent.id }),
    initialData: [],
  });

  const calculateTrend = (metricKey) => {
    if (metrics.length < 2) return { value: 0, direction: 'neutral' };
    
    const recent = metrics.slice(0, 7);
    const previous = metrics.slice(7, 14);
    
    const recentAvg = recent.reduce((sum, m) => sum + (m[metricKey] || 0), 0) / recent.length;
    const previousAvg = previous.reduce((sum, m) => sum + (m[metricKey] || 0), 0) / previous.length;
    
    const change = recentAvg - previousAvg;
    const percentChange = previousAvg !== 0 ? (change / previousAvg) * 100 : 0;
    
    return {
      value: Math.abs(percentChange),
      direction: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'neutral'
    };
  };

  const successTrend = calculateTrend('success_rate');
  const ratingTrend = calculateTrend('avg_rating');
  const errorTrend = calculateTrend('error_rate');
  const speedTrend = calculateTrend('avg_completion_time');

  const chartData = metrics.map(m => ({
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'Success Rate': m.success_rate || 0,
    'Tasks': m.tasks_completed || 0,
    'Rating': (m.avg_rating || 0) * 20,
    'Errors': m.error_rate || 0
  }));

  const TrendBadge = ({ trend }) => {
    if (trend.direction === 'up') {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <TrendingUp className="w-3 h-3 mr-1" />
          {trend.value.toFixed(1)}%
        </Badge>
      );
    } else if (trend.direction === 'down') {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <TrendingDown className="w-3 h-3 mr-1" />
          {trend.value.toFixed(1)}%
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
        <Minus className="w-3 h-3 mr-1" />
        Stable
      </Badge>
    );
  };

  const latestMetrics = metrics[0] || {};
  const positiveFeedback = feedback.filter(f => f.feedback_type === 'positive').length;
  const totalFeedback = feedback.length;
  const feedbackPositiveRate = totalFeedback > 0 ? (positiveFeedback / totalFeedback) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glassmorphism-light border-slate-800/50 p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-400" />
            </div>
            <TrendBadge trend={successTrend} />
          </div>
          <p className="text-2xl font-bold text-white">{(latestMetrics.success_rate || 0).toFixed(1)}%</p>
          <p className="text-sm text-slate-400">Success Rate</p>
        </Card>

        <Card className="glassmorphism-light border-slate-800/50 p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-blue-400" />
            </div>
            <TrendBadge trend={ratingTrend} />
          </div>
          <p className="text-2xl font-bold text-white">{(latestMetrics.avg_rating || 0).toFixed(1)}/5</p>
          <p className="text-sm text-slate-400">Average Rating</p>
        </Card>

        <Card className="glassmorphism-light border-slate-800/50 p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <TrendBadge trend={speedTrend} />
          </div>
          <p className="text-2xl font-bold text-white">
            {Math.floor((latestMetrics.avg_completion_time || 0) / 60)}m
          </p>
          <p className="text-sm text-slate-400">Avg Completion</p>
        </Card>

        <Card className="glassmorphism-light border-slate-800/50 p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <TrendBadge trend={{...errorTrend, direction: errorTrend.direction === 'up' ? 'down' : errorTrend.direction === 'down' ? 'up' : 'neutral'}} />
          </div>
          <p className="text-2xl font-bold text-white">{(latestMetrics.error_rate || 0).toFixed(1)}%</p>
          <p className="text-sm text-slate-400">Error Rate</p>
        </Card>
      </div>

      <Card className="glassmorphism-light border-slate-800/50 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Activity className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Performance Trends (30 Days)</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 12 }} />
            <YAxis stroke="#64748b" style={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="Success Rate"
              stroke="#10b981"
              fill="#10b98120"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="Rating"
              stroke="#3b82f6"
              fill="#3b82f620"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glassmorphism-light border-slate-800/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Task Volume</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" style={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="Tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glassmorphism-light border-slate-800/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Error Rate Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" style={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line
                type="monotone"
                dataKey="Errors"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="glassmorphism-light border-slate-800/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">User Feedback Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/30">
            <p className="text-3xl font-bold text-green-400">{positiveFeedback}</p>
            <p className="text-sm text-slate-400 mt-1">Positive</p>
          </div>
          <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/30">
            <p className="text-3xl font-bold text-red-400">
              {feedback.filter(f => f.feedback_type === 'negative').length}
            </p>
            <p className="text-sm text-slate-400 mt-1">Negative</p>
          </div>
          <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <p className="text-3xl font-bold text-blue-400">{feedbackPositiveRate.toFixed(0)}%</p>
            <p className="text-sm text-slate-400 mt-1">Positive Rate</p>
          </div>
        </div>
      </Card>
    </div>
  );
}