import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { getDomainColor } from '../utils/domainColors';

export default function DomainDistributionChart({ data = [] }) {
  // Mock data with domain color tokens
  const displayData = data.length > 0 ? data : [
    { name: 'Marketing', value: 156 },
    { name: 'Sales', value: 142 },
    { name: 'Customer Support', value: 189 },
    { name: 'Fulfillment', value: 98 },
    { name: 'Operations', value: 75 },
    { name: 'Leadership', value: 52 },
    { name: 'Innovation', value: 48 },
    { name: 'Enablement', value: 61 },
    { name: 'Feedback Loop', value: 44 },
    { name: 'Offer', value: 38 },
  ].map(item => ({
    ...item,
    color: getDomainColor(item.name).solid
  }));

  return (
    <Card className="h-full flex flex-col" style={{ 
      backgroundColor: 'var(--bg-card)', 
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px'
    }}>
      <CardHeader className="pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <CardTitle className="flex items-center text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          <PieIcon className="w-5 h-5 mr-2" style={{ color: 'var(--text-muted)' }} />
          Tasks by Domain Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 flex-1 flex items-center justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="45%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={3}
              dataKey="value"
            >
              {displayData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || getDomainColor(entry.name).solid} 
                  stroke="rgba(0,0,0,0.2)" 
                  strokeWidth={1} 
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '12px',
              }}
              itemStyle={{
                color: '#fff',
                fontSize: '13px',
                fontWeight: '500',
              }}
              labelStyle={{
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '4px',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}