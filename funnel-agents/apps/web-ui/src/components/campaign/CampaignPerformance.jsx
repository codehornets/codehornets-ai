import { Card } from '@/components/ui/card';
import { TrendingUp, DollarSign, Target, Users } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CampaignPerformance() {
  // Mock data
  const metrics = [
    { label: 'Leads Generated', value: '247', icon: Users, color: 'blue', trend: '+12%' },
    { label: 'Conversion Rate', value: '8.4%', icon: Target, color: 'green', trend: '+2.1%' },
    { label: 'Cost per Lead', value: '$42', icon: DollarSign, color: 'purple', trend: '-8%' },
    { label: 'ROI', value: '3.2x', icon: TrendingUp, color: 'orange', trend: '+15%' }
  ];

  const leadsOverTime = [
    { date: 'Jan 8', leads: 12, conversions: 3 },
    { date: 'Jan 9', leads: 19, conversions: 4 },
    { date: 'Jan 10', leads: 25, conversions: 6 },
    { date: 'Jan 11', leads: 31, conversions: 8 },
    { date: 'Jan 12', leads: 28, conversions: 7 },
    { date: 'Jan 13', leads: 35, conversions: 9 },
    { date: 'Jan 14', leads: 42, conversions: 11 }
  ];

  const channelBreakdown = [
    { channel: 'LinkedIn', leads: 120, conversions: 35 },
    { channel: 'Email', leads: 85, conversions: 28 },
    { channel: 'Google Ads', leads: 42, conversions: 12 }
  ];

  const topContent = [
    { title: 'LinkedIn Carousel: "AI in Marketing"', views: 12400, clicks: 892, conversions: 47 },
    { title: 'Email: Product Launch Announcement', views: 8200, clicks: 1240, conversions: 62 },
    { title: 'Google Ad: Free Demo CTA', views: 45000, clicks: 2100, conversions: 89 }
  ];

  return (
    <div className="space-y-6">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          const colorMap = {
            blue: 'text-blue-600 bg-blue-50',
            green: 'text-green-600 bg-green-50',
            purple: 'text-purple-600 bg-purple-50',
            orange: 'text-orange-600 bg-orange-50'
          };
          
          return (
            <Card 
              key={idx}
              className="p-5"
              style={{ 
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '12px'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  {metric.label}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[metric.color]}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{metric.value}</div>
              <p className="text-xs text-green-600 mt-1">{metric.trend} vs last week</p>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Leads Over Time
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={leadsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Line type="monotone" dataKey="leads" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="conversions" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Channel Performance
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={channelBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="channel" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="leads" fill="#3B82F6" />
              <Bar dataKey="conversions" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Content */}
      <Card style={{ 
        backgroundColor: 'var(--bg-card)', 
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Top Performing Content
        </h3>
        <div className="space-y-3">
          {topContent.map((item, idx) => (
            <div 
              key={idx} 
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="flex-1">
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  {item.title}
                </p>
                <div className="flex items-center space-x-4 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>{item.views.toLocaleString()} views</span>
                  <span>{item.clicks.toLocaleString()} clicks</span>
                  <span className="text-green-600 font-medium">{item.conversions} conversions</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}