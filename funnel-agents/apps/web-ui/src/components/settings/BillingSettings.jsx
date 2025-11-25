import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, TrendingUp, Zap, Database, Users, Loader2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useBillingInfo,
  useUsageStats,
  useInvoiceHistory,
  useDownloadInvoice,
  useCancelSubscription,
} from '@/hooks/useSettings';

export default function BillingSettings() {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch data
  const { data: billingData, isLoading: loadingBilling, error: billingError } = useBillingInfo();
  const { data: usageData, isLoading: loadingUsage } = useUsageStats();
  const { data: invoicesData, isLoading: loadingInvoices } = useInvoiceHistory({ limit: 10 });

  // Mutations
  const downloadInvoiceMutation = useDownloadInvoice();
  const cancelSubscriptionMutation = useCancelSubscription();

  const billingInfo = billingData?.billing || {};
  const usage = usageData?.usage || {};
  const invoices = invoicesData?.invoices || [];

  const isLoading = loadingBilling || loadingUsage || loadingInvoices;

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      await downloadInvoiceMutation.mutateAsync(invoiceId);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscriptionMutation.mutateAsync(cancelReason);
      setCancelModalOpen(false);
      setCancelReason('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 100) return '[&>div]:bg-red-500';
    if (percentage >= 80) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-blue-500';
  };

  const getUsageTextColor = (percentage) => {
    if (percentage >= 100) return 'text-red-400 font-medium';
    if (percentage >= 80) return 'text-yellow-400 font-medium';
    return 'text-slate-500';
  };

  if (billingError) {
    return (
      <div className="space-y-6">
        <Card className="glassmorphism-light border-slate-800/50">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <div className="text-center">
                <p className="text-lg font-medium text-slate-300">Failed to load billing information</p>
                <p className="text-sm text-slate-400 mt-1">{billingError.message || 'An error occurred'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="glassmorphism-light border-slate-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
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
                <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {billingInfo.planName || 'Enterprise Plan'}
                </h3>
                <p className="text-slate-400 mb-4">{billingInfo.planDescription || 'Full access to all features'}</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    ${billingInfo.amount || 299}
                  </span>
                  <span className="text-slate-400">/{billingInfo.interval || 'month'}</span>
                </div>
              </div>
              <div className="text-right space-y-2">
                <Button className="bg-blue-600 hover:bg-blue-700 w-full">
                  Upgrade Plan
                </Button>
                {billingInfo.nextBillingDate && (
                  <p className="text-xs text-slate-500">
                    Next billing: {format(new Date(billingInfo.nextBillingDate), 'MMM d, yyyy')}
                  </p>
                )}
                {billingInfo.status !== 'cancelled' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCancelModalOpen(true)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full"
                  >
                    Cancel Subscription
                  </Button>
                )}
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
            {usage.insight && (
              <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-blue-400 text-sm">
                  <strong>{usage.insight}</strong>
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tasks */}
              {usage.tasks && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-blue-400" />
                      <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Tasks Executed</span>
                    </div>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {usage.tasks.current?.toLocaleString() || 0} / {usage.tasks.limit?.toLocaleString() || 0}
                    </span>
                  </div>
                  <Progress
                    value={usage.tasks.percentage || 0}
                    className={`h-2 ${getUsageColor(usage.tasks.percentage || 0)}`}
                  />
                  <p className={`text-xs ${getUsageTextColor(usage.tasks.percentage || 0)}`}>
                    {usage.tasks.percentage || 0}% of monthly quota used
                    {usage.tasks.percentage >= 80 && ' - Consider upgrading'}
                  </p>
                </div>
              )}

              {/* Tokens */}
              {usage.tokens && (
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
                    value={usage.tokens.percentage || 0}
                    className={`h-2 ${getUsageColor(usage.tokens.percentage || 0)}`}
                  />
                  <p className={`text-xs ${getUsageTextColor(usage.tokens.percentage || 0)}`}>
                    {usage.tokens.percentage || 0}% of monthly quota used
                    {usage.tokens.percentage >= 80 && ' - Monitor closely'}
                  </p>
                </div>
              )}

              {/* Agents */}
              {usage.agents && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Active Agents</span>
                    </div>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {usage.agents.current || 0} / {usage.agents.limit || 0}
                    </span>
                  </div>
                  <Progress
                    value={usage.agents.percentage || 0}
                    className={`h-2 ${getUsageColor(usage.agents.percentage || 0)}`}
                  />
                  <p className={`text-xs ${getUsageTextColor(usage.agents.percentage || 0)}`}>
                    {usage.agents.percentage || 0}% of agent limit
                    {usage.agents.percentage >= 80 && ' - Approaching limit'}
                  </p>
                </div>
              )}

              {/* Storage */}
              {usage.storage && (
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
                    value={usage.storage.percentage || 0}
                    className={`h-2 ${getUsageColor(usage.storage.percentage || 0)}`}
                  />
                  <p className={`text-xs ${getUsageTextColor(usage.storage.percentage || 0)}`}>
                    {usage.storage.percentage || 0}% of storage used
                  </p>
                </div>
              )}
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
            {loadingInvoices ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CreditCard className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-slate-400">No invoices yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {invoice.invoiceNumber || `Invoice ${invoice.id}`}
                        </p>
                        <p className="text-slate-400 text-sm mt-1">
                          {format(new Date(invoice.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            ${invoice.amount}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            invoice.status === 'paid'
                              ? 'bg-green-500/20 text-green-400'
                              : invoice.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {invoice.status.toUpperCase()}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                          disabled={downloadInvoiceMutation.isPending}
                          className="text-slate-400 hover:text-white"
                        >
                          {downloadInvoiceMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Subscription Modal */}
      <AlertDialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm text-slate-300 mb-2 block">
              Please tell us why you're cancelling (optional):
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm"
              rows="3"
              placeholder="Your feedback helps us improve..."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-slate-700 text-white hover:bg-slate-800"
              disabled={cancelSubscriptionMutation.isPending}
            >
              Keep Subscription
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={cancelSubscriptionMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelSubscriptionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
