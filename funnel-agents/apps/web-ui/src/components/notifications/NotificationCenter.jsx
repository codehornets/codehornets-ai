import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/store';
import { formatDistanceToNow } from 'date-fns';

const NotificationIcon = ({ type }) => {
  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
  };

  const Icon = icons[type] || Info;
  const colors = {
    info: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
  };

  return <Icon className={cn('h-5 w-5', colors[type])} />;
};

const NotificationItem = ({ notification, onClose }) => {
  const navigate = useNavigate();
  const { markAsRead, markAsUnread, removeNotification } = useNotificationStore();

  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  const handleToggleRead = (e) => {
    e.stopPropagation();
    if (notification.read) {
      markAsUnread(notification.id);
    } else {
      markAsRead(notification.id);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    removeNotification(notification.id);
  };

  return (
    <div
      className={cn(
        'group relative flex gap-3 p-4 border-b border-slate-200 dark:border-slate-800',
        'hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors',
        notification.link && 'cursor-pointer',
        !notification.read && 'bg-blue-50/50 dark:bg-blue-950/20'
      )}
      onClick={handleClick}
      role={notification.link ? 'button' : 'article'}
      tabIndex={notification.link ? 0 : undefined}
      onKeyDown={(e) => {
        if (notification.link && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`${notification.title}. ${notification.read ? 'Read' : 'Unread'}`}
    >
      {!notification.read && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"
          aria-hidden="true"
        />
      )}

      <div className="flex-shrink-0 mt-0.5">
        <NotificationIcon type={notification.type} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
            {notification.title}
          </h4>
          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
          </span>
        </div>

        {notification.message && (
          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-2">
            {notification.message}
          </p>
        )}

        {notification.metadata?.tags && (
          <div className="flex flex-wrap gap-1 mt-2">
            {notification.metadata.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
              aria-label="Notification actions"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleToggleRead}>
              {notification.read ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Mark as unread
                </>
              ) : (
                <>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark as read
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default function NotificationCenter() {
  const [open, setOpen] = React.useState(false);
  const wsRef = useRef(null);

  const {
    notifications,
    unreadCount,
    markAllAsRead,
    clearAll,
    addNotification,
  } = useNotificationStore();

  // WebSocket connection for real-time notifications
  useEffect(() => {
    // TODO: Replace with your actual WebSocket URL
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/notifications';

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WebSocket connected for notifications');
        };

        ws.onmessage = (event) => {
          try {
            const notification = JSON.parse(event.data);
            addNotification(notification);
          } catch (error) {
            console.error('Failed to parse notification:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected, reconnecting in 5s...');
          setTimeout(connectWebSocket, 5000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    // Uncomment when WebSocket is ready
    // connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [addNotification]);

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      clearAll();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="text-xs"
                  aria-label="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearAll}
                className="h-8 w-8"
                aria-label="Clear all notifications"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="h-[500px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                No notifications
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div role="list" aria-label="Notifications">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClose={() => setOpen(false)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
