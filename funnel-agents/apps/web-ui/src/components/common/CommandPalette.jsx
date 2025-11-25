import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  GitBranch,
  BarChart3,
  Plug,
  Settings,
  Plus,
  Clock,
  FileText,
  Phone,
  DollarSign,
  Bot,
  Presentation,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { Badge } from '@/components/ui/badge';

// Navigation items
const navigationItems = [
  { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard, path: '/Dashboard', keywords: ['home', 'overview'] },
  { id: 'workspaces', title: 'Clients', icon: Users, path: '/Workspaces', keywords: ['clients', 'customers', 'accounts'] },
  { id: 'projects', title: 'Campaigns', icon: CheckSquare, path: '/Projects', keywords: ['campaigns', 'projects'] },
  { id: 'boards', title: 'Boards', icon: Presentation, path: '/Boards', keywords: ['kanban', 'tasks', 'boards'] },
  { id: 'content', title: 'Content Library', icon: FileText, path: '/ContentLibrary', keywords: ['content', 'assets', 'media'] },
  { id: 'leads', title: 'Leads', icon: Users, path: '/Leads', keywords: ['leads', 'prospects'] },
  { id: 'contacts', title: 'Contacts', icon: Phone, path: '/Contacts', keywords: ['contacts', 'people'] },
  { id: 'deals', title: 'Deals', icon: DollarSign, path: '/Deals', keywords: ['deals', 'opportunities', 'sales'] },
  { id: 'agents', title: 'Agents', icon: Bot, path: '/Agents', keywords: ['agents', 'ai', 'bots'] },
  { id: 'tasks', title: 'Tasks', icon: CheckSquare, path: '/Tasks', keywords: ['tasks', 'todos'] },
  { id: 'workflows', title: 'Automations', icon: GitBranch, path: '/Workflows', keywords: ['workflows', 'automation', 'automations'] },
  { id: 'analytics', title: 'Reports', icon: BarChart3, path: '/Analytics', keywords: ['reports', 'analytics', 'insights'] },
  { id: 'integrations', title: 'Integrations', icon: Plug, path: '/Integrations', keywords: ['integrations', 'connections', 'apps'] },
  { id: 'settings', title: 'Settings', icon: Settings, path: '/Settings', keywords: ['settings', 'preferences', 'config'] },
];

// Quick actions
const quickActions = [
  { id: 'new-lead', title: 'Create New Lead', icon: Plus, action: 'create', entity: 'lead', keywords: ['new', 'create', 'lead'] },
  { id: 'new-contact', title: 'Create New Contact', icon: Plus, action: 'create', entity: 'contact', keywords: ['new', 'create', 'contact'] },
  { id: 'new-deal', title: 'Create New Deal', icon: Plus, action: 'create', entity: 'deal', keywords: ['new', 'create', 'deal', 'opportunity'] },
  { id: 'new-task', title: 'Create New Task', icon: Plus, action: 'create', entity: 'task', keywords: ['new', 'create', 'task', 'todo'] },
  { id: 'new-campaign', title: 'Create New Campaign', icon: Plus, action: 'create', entity: 'campaign', keywords: ['new', 'create', 'campaign', 'project'] },
  { id: 'new-agent', title: 'Create New Agent', icon: Plus, action: 'create', entity: 'agent', keywords: ['new', 'create', 'agent', 'bot'] },
];

export default function CommandPalette() {
  const navigate = useNavigate();
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const [search, setSearch] = useState('');
  const [recentItems, setRecentItems] = useState([]);

  // Load recent items from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('command-palette-recent');
    if (stored) {
      try {
        setRecentItems(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse recent items:', error);
      }
    }
  }, []);

  // Save to recent items
  const addToRecent = useCallback((item) => {
    setRecentItems((prev) => {
      const filtered = prev.filter(i => i.id !== item.id);
      const updated = [item, ...filtered].slice(0, 5);
      localStorage.setItem('command-palette-recent', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Filter items based on search
  const filteredNavigation = useMemo(() => {
    if (!search) return navigationItems;

    const searchLower = search.toLowerCase();
    return navigationItems.filter((item) => {
      return (
        item.title.toLowerCase().includes(searchLower) ||
        item.keywords.some(kw => kw.toLowerCase().includes(searchLower))
      );
    });
  }, [search]);

  const filteredActions = useMemo(() => {
    if (!search) return quickActions;

    const searchLower = search.toLowerCase();
    return quickActions.filter((item) => {
      return (
        item.title.toLowerCase().includes(searchLower) ||
        item.keywords.some(kw => kw.toLowerCase().includes(searchLower))
      );
    });
  }, [search]);

  // Handle navigation
  const handleNavigate = (item) => {
    addToRecent({ ...item, timestamp: Date.now() });
    navigate(item.path);
    setCommandPaletteOpen(false);
    setSearch('');
  };

  // Handle action
  const handleAction = (action) => {
    addToRecent({ ...action, timestamp: Date.now() });

    // Navigate to the appropriate page with create mode
    const paths = {
      lead: '/Leads?action=create',
      contact: '/Contacts?action=create',
      deal: '/Deals?action=create',
      task: '/Tasks?action=create',
      campaign: '/Projects?action=create',
      agent: '/Agents?action=create',
    };

    if (paths[action.entity]) {
      navigate(paths[action.entity]);
    }

    setCommandPaletteOpen(false);
    setSearch('');
  };

  // Handle recent item
  const handleRecent = (item) => {
    if (item.path) {
      handleNavigate(item);
    } else if (item.action) {
      handleAction(item);
    }
  };

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
    >
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Recent Items */}
        {!search && recentItems.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {recentItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleRecent(item)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4 text-slate-500" />
                    <span>{item.title}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Recent
                    </Badge>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Quick Actions */}
        {filteredActions.length > 0 && (
          <>
            <CommandGroup heading="Quick Actions">
              {filteredActions.map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.id}
                    value={action.id}
                    onSelect={() => handleAction(action)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4 text-slate-500" />
                    <span>{action.title}</span>
                    <Badge variant="secondary" className="ml-auto">
                      Action
                    </Badge>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Navigation */}
        {filteredNavigation.length > 0 && (
          <CommandGroup heading="Navigation">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => handleNavigate(item)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4 text-slate-500" />
                  <span>{item.title}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
