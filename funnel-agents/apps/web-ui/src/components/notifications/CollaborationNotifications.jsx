import client from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Bell, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { formatDistanceToNow } from 'date-fns';

export default function CollaborationNotifications() {
  const navigate = useNavigate();

  const { data: collaborations = [] } = useQuery({
    queryKey: ['critical-collaborations'],
    queryFn: async () => {
      const all = await client.entities.AgentCollaboration.list('-created_date', 20);
      return all.filter(c => 
        (c.priority === 'critical' || c.priority === 'high') && 
        c.status === 'pending'
      );
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    initialData: [],
  });

  const unreadCount = collaborations.length;

  const getIcon = (type) => {
    switch(type) {
      case 'issue_alert': return AlertTriangle;
      case 'opportunity_identified': return TrendingUp;
      default: return Users;
    }
  };

  const handleNavigate = (collab) => {
    navigate(createPageUrl('ClientWorkspace') + `?id=${collab.client_id}&tab=communications`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-[var(--bg-surface-hover)] relative h-9 w-9 md:h-10 md:w-10"
          style={{ color: 'var(--text-muted)' }}
        >
          <Bell className="w-4 h-4 md:w-5 md:h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96 overflow-y-auto"
        style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-medium)' 
        }}
      >
        <DropdownMenuLabel className="flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
          <span>Agent Collaborations</span>
          {unreadCount > 0 && (
            <Badge className="bg-red-500/20 text-red-400 text-xs">
              {unreadCount} new
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator style={{ backgroundColor: 'var(--border-subtle)' }} />

        {collaborations.length === 0 ? (
          <div className="p-4 text-center">
            <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No critical findings
            </p>
          </div>
        ) : (
          <>
            {collaborations.slice(0, 5).map((collab) => {
              const Icon = getIcon(collab.collaboration_type);

              return (
                <DropdownMenuItem
                  key={collab.id}
                  onClick={() => handleNavigate(collab)}
                  className="cursor-pointer p-3 focus:bg-[var(--bg-surface-hover)]"
                >
                  <div className="flex items-start space-x-3 w-full">
                    <div className={`p-1.5 rounded ${
                      collab.priority === 'critical' ? 'bg-red-500/20' : 'bg-orange-500/20'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        collab.priority === 'critical' ? 'text-red-400' : 'text-orange-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {collab.title}
                        </p>
                        <Badge className={`text-xs ml-2 flex-shrink-0 ${
                          collab.priority === 'critical' 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {collab.priority}
                        </Badge>
                      </div>
                      <p className="text-xs mb-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                        {collab.message}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {collab.initiating_agent_name} • {formatDistanceToNow(new Date(collab.created_date), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
            {collaborations.length > 5 && (
              <>
                <DropdownMenuSeparator style={{ backgroundColor: 'var(--border-subtle)' }} />
                <DropdownMenuItem
                  onClick={() => navigate(createPageUrl('Dashboard'))}
                  className="justify-center text-center cursor-pointer"
                  style={{ color: 'var(--accent)' }}
                >
                  View all {collaborations.length} notifications
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}