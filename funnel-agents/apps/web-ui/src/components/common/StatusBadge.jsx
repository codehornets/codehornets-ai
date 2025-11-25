import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Clock, Ban } from 'lucide-react';

export default function StatusBadge({ status, size = 'default' }) {
  const configs = {
    active: {
      label: 'Active',
      className: 'bg-green-500/10 text-green-400 border-green-500/20',
      icon: CheckCircle2,
    },
    inactive: {
      label: 'Inactive',
      className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      icon: Ban,
    },
    pending: {
      label: 'Pending',
      className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      icon: Clock,
    },
    running: {
      label: 'Running',
      className: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse',
      icon: Loader2,
      spin: true,
    },
    completed: {
      label: 'Completed',
      className: 'bg-green-500/10 text-green-400 border-green-500/20',
      icon: CheckCircle2,
    },
    failed: {
      label: 'Failed',
      className: 'bg-red-500/10 text-red-400 border-red-500/20',
      icon: XCircle,
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      icon: Ban,
    },
  };

  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} border`}>
      <Icon className={`w-3 h-3 mr-1 ${config.spin ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  );
}