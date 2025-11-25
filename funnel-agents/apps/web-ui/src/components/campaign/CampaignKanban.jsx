import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CampaignKanban({ tasks = [], agents = [], onTaskMove, onTaskClick }) {
  const [filters, setFilters] = useState({
    status: 'all',
    assignee: 'all',
    priority: 'all'
  });

  const columns = [
    { id: 'pending', label: 'Backlog', color: 'slate' },
    { id: 'running', label: 'In Progress', color: 'blue' },
    { id: 'review', label: 'Review', color: 'purple' },
    { id: 'completed', label: 'Completed', color: 'green' }
  ];

  const priorityColors = {
    low: 'bg-slate-100 text-slate-700 border-slate-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    urgent: 'bg-red-100 text-red-700 border-red-200'
  };

  const filteredTasks = tasks.filter(task => {
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.assignee !== 'all' && task.agent_id !== filters.assignee) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    return true;
  });

  const getTasksByColumn = (columnId) => {
    return filteredTasks.filter(t => {
      if (columnId === 'review') return t.status === 'review' || t.status === 'blocked';
      return t.status === columnId;
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center space-x-3">
        <Select value={filters.status} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}>
          <SelectTrigger className="w-40" style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)'
          }}>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-medium)' }}>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Backlog</SelectItem>
            <SelectItem value="running">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.assignee} onValueChange={(v) => setFilters(prev => ({ ...prev, assignee: v }))}>
          <SelectTrigger className="w-40" style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)'
          }}>
            <SelectValue placeholder="All Assignees" />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-medium)' }}>
            <SelectItem value="all">All Assignees</SelectItem>
            {agents.map(agent => (
              <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.priority} onValueChange={(v) => setFilters(prev => ({ ...prev, priority: v }))}>
          <SelectTrigger className="w-32" style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)'
          }}>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-medium)' }}>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(column => {
          const columnTasks = getTasksByColumn(column.id);
          return (
            <div key={column.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {column.label}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ 
                  backgroundColor: 'var(--bg-surface-hover)',
                  color: 'var(--text-muted)'
                }}>
                  {columnTasks.length}
                </span>
              </div>
              
              <div className="space-y-2 min-h-[400px]" style={{ 
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '8px',
                padding: '12px',
                border: '1px solid var(--border-subtle)'
              }}>
                {columnTasks.map((task, idx) => {
                  const agent = agents.find(a => a.id === task.agent_id);
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                    >
                      <Card 
                        className="p-3 cursor-pointer transition-all hover:shadow-md"
                        onClick={() => onTaskClick?.(task)}
                        style={{ 
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px'
                        }}
                      >
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-slate-900 line-clamp-2">
                            {task.title}
                          </h4>
                          
                          <div className="flex items-center flex-wrap gap-1.5">
                            {agent && (
                              <div className="flex items-center space-x-1" title={`Handled by ${agent.name}`}>
                                <Bot className="w-3 h-3 text-blue-600" />
                                <span className="text-xs text-slate-600">{agent.name}</span>
                              </div>
                            )}
                            
                            {task.priority && task.priority !== 'medium' && (
                              <Badge 
                                className={`text-xs ${priorityColors[task.priority]}`}
                                style={{ fontSize: '10px', padding: '2px 6px' }}
                              >
                                {task.priority}
                              </Badge>
                            )}

                            {task.status === 'blocked' && (
                              <Badge className="text-xs bg-red-100 text-red-700 border-red-200">
                                Blocked
                              </Badge>
                            )}
                          </div>

                          {task.due_date && (
                            <div className="flex items-center space-x-1 text-xs text-slate-500">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
                
                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}