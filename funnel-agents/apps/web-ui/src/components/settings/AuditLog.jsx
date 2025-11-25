import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Filter, Download, Search, ChevronDown, ChevronRight, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';

export default function AuditLog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('all');
  const [expandedLog, setExpandedLog] = useState(null);

  const logs = [
    { 
      id: 1, 
      action: 'task.created', 
      user: 'John Doe', 
      description: 'Created task "Generate blog post"',
      timestamp: new Date('2024-01-15T10:30:00'),
      ip: '192.168.1.1',
      details: { task_id: 'task_123', title: 'Generate blog post', priority: 'high', agent: 'Content Creator' },
    },
    { 
      id: 2, 
      action: 'agent.activated', 
      user: 'Jane Smith', 
      description: 'Activated agent "Content Creator"',
      timestamp: new Date('2024-01-15T10:15:00'),
      ip: '192.168.1.2',
      details: { agent_id: 'agent_456', name: 'Content Creator', domain: 'Marketing', previous_status: 'inactive' },
    },
    { 
      id: 3, 
      action: 'user.invited', 
      user: 'John Doe', 
      description: 'Invited team member sarah@agenthub.ai',
      timestamp: new Date('2024-01-15T09:45:00'),
      ip: '192.168.1.1',
    },
    { 
      id: 4, 
      action: 'settings.updated', 
      user: 'John Doe', 
      description: 'Updated organization settings',
      timestamp: new Date('2024-01-15T09:30:00'),
      ip: '192.168.1.1',
    },
    { 
      id: 5, 
      action: 'api_key.created', 
      user: 'Mike Johnson', 
      description: 'Created new API key "Production API Key"',
      timestamp: new Date('2024-01-15T09:00:00'),
      ip: '192.168.1.3',
    },
    { 
      id: 6, 
      action: 'task.executed', 
      user: 'System', 
      description: 'Executed task "Analyze competitor pricing"',
      timestamp: new Date('2024-01-15T08:45:00'),
      ip: 'system',
    },
    { 
      id: 7, 
      action: 'agent.deactivated', 
      user: 'Jane Smith', 
      description: 'Deactivated agent "Brand Designer"',
      timestamp: new Date('2024-01-15T08:30:00'),
      ip: '192.168.1.2',
    },
    { 
      id: 8, 
      action: 'user.role_changed', 
      user: 'John Doe', 
      description: 'Changed Mike Johnson role to Manager',
      timestamp: new Date('2024-01-15T08:00:00'),
      ip: '192.168.1.1',
    },
  ];

  const actionColors = {
    'task.created': 'text-blue-400',
    'task.executed': 'text-green-400',
    'agent.activated': 'text-green-400',
    'agent.deactivated': 'text-amber-400',
    'user.invited': 'text-purple-400',
    'user.role_changed': 'text-amber-400',
    'settings.updated': 'text-blue-400',
    'api_key.created': 'text-red-400',
  };

  const uniqueActors = ['all', ...new Set(logs.map(log => log.user))];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action.startsWith(actionFilter);
    const matchesActor = actorFilter === 'all' || log.user === actorFilter;
    return matchesSearch && matchesAction && matchesActor;
  });

  return (
    <Card className="glassmorphism-light border-slate-800/50">
      <CardHeader className="border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center" style={{ color: 'var(--text-primary)' }}>
            <FileText className="w-5 h-5 mr-2 text-blue-400" />
            Audit Log
          </CardTitle>
          <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800/50">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Filters */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700/50"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                All Actions
              </SelectItem>
              <SelectItem value="task" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                Tasks
              </SelectItem>
              <SelectItem value="agent" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                Agents
              </SelectItem>
              <SelectItem value="user" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                Users
              </SelectItem>
              <SelectItem value="settings" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                Settings
              </SelectItem>
              <SelectItem value="api_key" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                API Keys
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={actorFilter} onValueChange={setActorFilter}>
            <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700 text-white">
              <User className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {uniqueActors.map(actor => (
                <SelectItem 
                  key={actor} 
                  value={actor} 
                  className="text-slate-300 focus:bg-slate-700 focus:text-white"
                >
                  {actor === 'all' ? 'All Users' : actor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Log Entries */}
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div 
              key={log.id}
              className="glassmorphism-light border-slate-800/50 rounded-lg hover:border-blue-500/30 transition-all overflow-hidden"
            >
              <div 
                className="p-4 cursor-pointer"
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`font-mono text-sm font-medium ${actionColors[log.action] || 'text-slate-400'}`}>
                        {log.action}
                      </span>
                      <span className="text-slate-500 text-xs">•</span>
                      <span className="text-slate-400 text-sm">{log.user}</span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{log.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                      <span>{format(log.timestamp, 'MMM d, yyyy h:mm a')}</span>
                      <span>•</span>
                      <span>IP: {log.ip}</span>
                    </div>
                  </div>
                  {log.details && (
                    <Button variant="ghost" size="icon" className="text-slate-400">
                      {expandedLog === log.id ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {expandedLog === log.id && log.details && (
                <div className="px-4 pb-4 border-t border-slate-800/50 pt-3">
                  <p className="text-xs text-slate-500 mb-2 font-medium">Event Details:</p>
                  <pre className="bg-slate-900/50 rounded p-3 text-xs text-slate-300 overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No audit logs found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}