import { Card } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Award, CheckCircle2 } from 'lucide-react';

export default function PerformanceTrends({ agents, tasks, feedback }) {
  // Performance by Domain
  const domainPerformance = {};
  agents.forEach(agent => {
    if (!domainPerformance[agent.domain]) {
      domainPerformance[agent.domain] = {
        domain: agent.domain,
        agents: 0,
        successRate: 0,
        totalTasks: 0,
      };
    }
    domainPerformance[agent.domain].agents += 1;
    domainPerformance[agent.domain].successRate += agent.metrics?.successRate || 0;
    domainPerformance[agent.domain].totalTasks += agent.metrics?.totalTasks || 0;
  });

  const domainData = Object.values(domainPerformance).map(d => ({
    ...d,
    successRate: d.agents > 0 ? (d.successRate / d.agents).toFixed(1) : 0,
  }));

  // Performance Distribution
  const performanceDistribution = [
    { name: 'Excellent', value: agents.filter(a => a.performanceLevel === 'excellent').length, color: '#10b981' },
    { name: 'Good', value: agents.filter(a => a.performanceLevel === 'good').length, color: '#3b82f6' },
    { name: 'Average', value: agents.filter(a => a.performanceLevel === 'average').length, color: '#f59e0b' },
    { name: 'Needs Work', value: agents.filter(a => a.performanceLevel === 'needs_improvement').length, color: '#ef4444' },
  ];

  // Task completion trends over last 30 days
  const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toISOString().split('T')[0],
        completed: 0,
        failed: 0,
      });
    }
    return days;
  };

  const trendData = getLast30Days();
  tasks.forEach(task => {
    const taskDate = new Date(task.created_date).toISOString().split('T')[0];
    const dayData = trendData.find(d => d.date === taskDate);
    if (dayData) {
      if (task.status === 'completed') dayData.completed += 1;
      if (task.status === 'failed') dayData.failed += 1;
    }
  });

  // Top performers
  const topPerformers = [...agents]
    .sort((a, b) => (b.metrics?.successRate || 0) - (a.metrics?.successRate || 0))
    .slice(0, 5);

  // Agents needing attention
  const needsAttention = [...agents]
    .filter(a => a.performanceLevel === 'needs_improvement' || a.metrics?.successRate < 60)
    .sort((a, b) => (a.metrics?.successRate || 0) - (b.metrics?.successRate || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Completion Trends */}
        <Card className="p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Task Completion Trends (30 Days)
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF" 
                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                tickFormatter={(date) => new Date(date).getDate().toString()}
              />
              <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} name="Failed" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Performance Distribution */}
        <Card className="p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center space-x-2 mb-4">
            <Award className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Performance Distribution
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={performanceDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {performanceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Domain Performance */}
      <Card className="p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Performance by Domain
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={domainData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="domain" 
              stroke="#9CA3AF" 
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
            />
            <Legend />
            <Bar dataKey="successRate" fill="#3b82f6" name="Success Rate %" />
            <Bar dataKey="totalTasks" fill="#10b981" name="Total Tasks" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Performers & Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card className="p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center space-x-2 mb-4">
            <Award className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Top Performers
            </h3>
          </div>
          <div className="space-y-3">
            {topPerformers.map((agent, index) => (
              <div 
                key={agent.id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'var(--bg-surface)' }}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20">
                    <span className="text-xs font-bold text-yellow-400">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {agent.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {agent.role}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-400">
                    {agent.metrics?.successRate.toFixed(1)}%
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {agent.metrics?.totalTasks} tasks
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Needs Attention */}
        <Card className="p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-orange-400" />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Needs Attention
            </h3>
          </div>
          <div className="space-y-3">
            {needsAttention.length > 0 ? (
              needsAttention.map((agent) => (
                <div 
                  key={agent.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-surface)' }}
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {agent.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {agent.role}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-400">
                      {agent.metrics?.successRate.toFixed(1)}%
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {agent.metrics?.totalTasks} tasks
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                All agents performing well! 🎉
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}