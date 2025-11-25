import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, TrendingUp, Zap, Database, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function BillingUsage() {
  const usage = {
    tasks: { current: 8450, limit: 10000, percentage: 84.5 },
    tokens: { current: 2.3, limit: 5, percentage: 46, unit: 'M' },
    agents: { current: 66, limit: 100, percentage: 66 },
    storage: { current: 128, limit: 500, percentage: 25.6, unit: 'GB' },
  };

  const billingHistory = [
    { id: 1, date: '2024-01-01', amount: 299, status: 'paid', invoice: 'INV-2024-001' },
    { id: 2, date: '2023-12-01', amount: 299, status: 'paid', invoice: 'INV-2023-012' },
    { id: 3, date: '2023-11-01', amount: 299, status: 'paid', invoice: 'INV-2023-011' },
  ];

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="glassmorphism-light border-slate-800/50">
        <CardHeader className="border-b border-slate-800/50">
          <CardTitle className="flex items-center" style={{ color: 'var(--text-primary)' }}>
            <CreditCard className="w-5 h-5 mr-2 text-blue-400" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Enterprise Plan</h3>
              <p className="text-slate-400 mb-4">Full access to all features and unlimited agents</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>$299</span>
                <span className="text-slate-400">/month</span>
              </div>
            </div>
            <div className="text-right">
              <Button className="bg-blue-600 hover:bg-blue-700 mb-2">
                Upgrade Plan
              </Button>
              <p className="text-xs text-slate-500">Next billing: Feb 1, 2024</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card className="glassmorphism-light border-slate-800/50">
        <CardHeader className="border-b border-slate-800/50">
          <CardTitle className="flex items-center" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
            Usage This Month
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Usage Insights */}
          <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-blue-400 text-sm">
              <strong>You're within limits for this month.</strong> Most usage comes from Marketing & Content agents. 
              Tasks completed: 8,450 • Hours saved: ~422h
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tasks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Tasks Executed</span>
                </div>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {usage.tasks.current.toLocaleString()} / {usage.tasks.limit.toLocaleString()}
                </span>
              </div>
              <Progress 
                value={usage.tasks.percentage} 
                className={`h-2 ${
                  usage.tasks.percentage >= 100 ? '[&>div]:bg-red-500' :
                  usage.tasks.percentage >= 80 ? '[&>div]:bg-yellow-500' :
                  '[&>div]:bg-blue-500'
                }`} 
              />
              <p className={`text-xs ${
                usage.tasks.percentage >= 100 ? 'text-red-400 font-medium' :
                usage.tasks.percentage >= 80 ? 'text-yellow-400 font-medium' :
                'text-slate-500'
              }`}>
                {usage.tasks.percentage}% of monthly quota used
                {usage.tasks.percentage >= 80 && ' - Consider upgrading'}
              </p>
            </div>

            {/* Tokens */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-green-400" />
                  <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Tokens Consumed</span>
                </div>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {usage.tokens.current}{usage.tokens.unit} / {usage.tokens.limit}{usage.tokens.unit}
                </span>
              </div>
              <Progress 
                value={usage.tokens.percentage} 
                className={`h-2 ${
                  usage.tokens.percentage >= 100 ? '[&>div]:bg-red-500' :
                  usage.tokens.percentage >= 80 ? '[&>div]:bg-yellow-500' :
                  '[&>div]:bg-green-500'
                }`}
              />
              <p className={`text-xs ${
                usage.tokens.percentage >= 100 ? 'text-red-400 font-medium' :
                usage.tokens.percentage >= 80 ? 'text-yellow-400 font-medium' :
                'text-slate-500'
              }`}>
                {usage.tokens.percentage}% of monthly quota used
                {usage.tokens.percentage >= 80 && ' - Monitor closely'}
              </p>
            </div>

            {/* Agents */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Active Agents</span>
                </div>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {usage.agents.current} / {usage.agents.limit}
                </span>
              </div>
              <Progress 
                value={usage.agents.percentage} 
                className={`h-2 ${
                  usage.agents.percentage >= 100 ? '[&>div]:bg-red-500' :
                  usage.agents.percentage >= 80 ? '[&>div]:bg-yellow-500' :
                  '[&>div]:bg-purple-500'
                }`}
              />
              <p className={`text-xs ${
                usage.agents.percentage >= 100 ? 'text-red-400 font-medium' :
                usage.agents.percentage >= 80 ? 'text-yellow-400 font-medium' :
                'text-slate-500'
              }`}>
                {usage.agents.percentage}% of agent limit
                {usage.agents.percentage >= 80 && ' - Approaching limit'}
              </p>
            </div>

            {/* Storage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Storage Used</span>
                </div>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {usage.storage.current}{usage.storage.unit} / {usage.storage.limit}{usage.storage.unit}
                </span>
              </div>
              <Progress 
                value={usage.storage.percentage} 
                className={`h-2 ${
                  usage.storage.percentage >= 100 ? '[&>div]:bg-red-500' :
                  usage.storage.percentage >= 80 ? '[&>div]:bg-yellow-500' :
                  '[&>div]:bg-amber-500'
                }`}
              />
              <p className={`text-xs ${
                usage.storage.percentage >= 100 ? 'text-red-400 font-medium' :
                usage.storage.percentage >= 80 ? 'text-yellow-400 font-medium' :
                'text-slate-500'
              }`}>
                {usage.storage.percentage}% of storage used
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card className="glassmorphism-light border-slate-800/50">
        <CardHeader className="border-b border-slate-800/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center" style={{ color: 'var(--text-primary)' }}>
              <CreditCard className="w-5 h-5 mr-2 text-blue-400" />
              Billing History
            </CardTitle>
            <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800/50">
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-800/50">
            {billingHistory.map((invoice) => (
              <div key={invoice.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{invoice.invoice}</p>
                    <p className="text-slate-400 text-sm mt-1">{invoice.date}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>${invoice.amount}</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                        {invoice.status.toUpperCase()}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}