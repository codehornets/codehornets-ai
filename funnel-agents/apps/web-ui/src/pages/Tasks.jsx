import { useState } from 'react';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Grid, List } from 'lucide-react';
import TaskBoard from '../components/tasks/TaskBoard';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import TaskDetailPanel from '../components/tasks/TaskDetailPanel';
import { toast } from 'sonner';

export default function Tasks() {
  const [viewMode, setViewMode] = useState('board');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => client.entities.Task.list('-created_date'),
    initialData: [],
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => client.entities.Agent.list(),
    initialData: [],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => client.entities.Workspace.list(),
    initialData: [],
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => client.entities.Campaign.list(),
    initialData: [],
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => client.entities.Task.create(taskData),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setCreateModalOpen(false);
      toast.success(`Task "${newTask.title}" created successfully`);
    },
    onError: () => {
      toast.error('Failed to create task');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => client.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated successfully');
    },
    onError: () => {
      toast.error('Failed to update task');
    },
  });

  const handleTaskAction = (task, action) => {
    switch (action) {
      case 'execute':
        updateTaskMutation.mutate({
          id: task.id,
          data: { status: 'running', started_at: new Date().toISOString() }
        });
        break;
      case 'cancel':
        updateTaskMutation.mutate({
          id: task.id,
          data: { status: 'cancelled' }
        });
        break;
      case 'retry':
        updateTaskMutation.mutate({
          id: task.id,
          data: { 
            status: 'pending',
            error_message: null,
            started_at: null,
            completed_at: null,
            duration: null
          }
        });
        break;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Tasks Command Center</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {tasks.length} total • {tasks.filter(t => t.status === 'running').length} running
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'board' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('board')}
              className={viewMode === 'board' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/50'}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/50'}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <Button 
            onClick={() => setCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Create Task</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Task Board/List */}
      {tasksLoading ? (
        <div className="glassmorphism-light border-slate-800/50 rounded-lg p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading tasks...</p>
        </div>
      ) : (
        <TaskBoard 
          tasks={tasks}
          onTaskClick={setSelectedTask}
          onTaskAction={handleTaskAction}
          viewMode={viewMode}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreateTask={createTaskMutation.mutate}
        agents={agents}
        clients={clients}
        campaigns={campaigns}
        tasks={tasks}
      />

      {/* Task Detail Panel */}
      <TaskDetailPanel
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        task={selectedTask}
        onTaskAction={handleTaskAction}
      />
    </div>
  );
}