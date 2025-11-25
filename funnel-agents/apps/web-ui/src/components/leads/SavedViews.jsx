import { Button } from '@/components/ui/button';
import { LayoutGrid, TrendingUp, User, Star, Clock } from 'lucide-react';

export default function SavedViews({ activeView, onViewChange, leadsCount }) {
  const views = [
    { id: 'all', label: 'All Leads', icon: LayoutGrid, count: leadsCount.all },
    { id: 'new_week', label: 'New This Week', icon: TrendingUp, count: leadsCount.newWeek },
    { id: 'my_leads', label: 'My Leads', icon: User, count: leadsCount.myLeads },
    { id: 'high_score', label: 'High Score (≥80)', icon: Star, count: leadsCount.highScore },
    { id: 'needs_followup', label: 'Needs Follow-up', icon: Clock, count: leadsCount.needsFollowup },
  ];

  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-2">
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = activeView === view.id;
        return (
          <Button
            key={view.id}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewChange(view.id)}
            className={`flex items-center space-x-2 whitespace-nowrap ${
              isActive
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{view.label}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs ${
              isActive ? 'bg-blue-700' : 'bg-slate-800'
            }`}>
              {view.count}
            </span>
          </Button>
        );
      })}
    </div>
  );
}