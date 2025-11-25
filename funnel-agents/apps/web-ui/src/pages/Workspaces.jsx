import { useState } from 'react';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, FolderOpen, Users, FolderKanban, MoreVertical, Settings, Trash2, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AIOnboardingWizard from '../components/workspaces/AIOnboardingWizard.jsx';
import { runClientOnboarding } from '../components/workspaces/OnboardingAutomation.jsx';

export default function Workspaces() {
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnboarding, setIsOnboarding] = useState(false);
  const queryClient = useQueryClient();

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => client.entities.Workspace.list('-created_date'),
    initialData: [],
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => client.entities.Task.list('-created_date', 200),
    initialData: [],
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => client.entities.Agent.list(),
    initialData: [],
  });

  const handleOnboardingComplete = async (formData) => {
    setIsOnboarding(true);
    setCreateModalOpen(false);

    const toastId = toast.loading('Setting up client workspace...');

    try {
      const results = await runClientOnboarding(formData);

      if (results.errors.length > 0) {
        toast.error('Setup completed with some errors', { id: toastId });
        console.error('Onboarding errors:', results.errors);
      } else {
        toast.success(
          `Client setup complete! Created ${results.agents.length} agents, ${results.campaigns.length} campaigns, and ${results.tasks.length} tasks`,
          { id: toastId, duration: 5000 }
        );
      }

      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      // Navigate to the new workspace
      if (results.workspace) {
        setTimeout(() => {
          navigate(createPageUrl('ClientWorkspace') + `?id=${results.workspace.id}`);
        }, 1000);
      }
    } catch (error) {
      toast.error('Failed to set up client workspace', { id: toastId });
      console.error('Onboarding error:', error);
    } finally {
      setIsOnboarding(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => client.entities.Workspace.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Client deleted');
    },
  });

  const colorOptions = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-red-500',
    yellow: 'from-yellow-500 to-amber-500',
  };

  // Calculate health metrics per workspace
  const getWorkspaceMetrics = (workspaceId) => {
    const workspaceTasks = tasks.filter(t => t.workspace_id === workspaceId);
    const thisWeek = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const tasksThisWeek = workspaceTasks.filter(t => new Date(t.created_date).getTime() > thisWeek);
    const completedThisWeek = tasksThisWeek.filter(t => t.status === 'completed').length;
    const needsReview = workspaceTasks.filter(t => t.status === 'pending' || t.status === 'failed').length;
    const workspaceAgents = agents.filter(a => a.workspace_id === workspaceId);
    const activeAgents = workspaceAgents.filter(a => a.status === 'active').length;
    
    return { completedThisWeek, needsReview, activeAgents };
  };

  const filteredWorkspaces = workspaces.filter(workspace => 
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (workspace.description && workspace.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>Clients</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{workspaces.length} {workspaces.length === 1 ? 'client' : 'clients'}</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 flex-shrink-0">
          <Plus className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Add Client</span>
        </Button>
      </div>

      {/* Search Bar */}
      {workspaces.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ color: 'var(--text-muted)' }} />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glassmorphism-light border-slate-800/50 p-6 rounded-lg animate-pulse">
              <div className="w-12 h-12 bg-slate-700 rounded-xl mb-4"></div>
              <div className="h-4 bg-slate-700 rounded mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <Card className="glassmorphism-light border-slate-800/50 p-12 text-center">
          <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No clients yet</h3>
          <p className="text-slate-400 mb-6">Create your first workspace to organize campaigns and tasks</p>
          <Button onClick={() => setCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkspaces.map((workspace, index) => {
            const metrics = getWorkspaceMetrics(workspace.id);
            return (
              <motion.div
                key={workspace.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={createPageUrl('ClientWorkspace') + `?id=${workspace.id}`}>
                  <Card className="p-6 hover:shadow-lg hover:scale-[1.02] transition-all group cursor-pointer h-full flex flex-col" style={{ 
                    backgroundColor: 'var(--bg-card)', 
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px'
                  }}>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorOptions[workspace.color] || colorOptions.blue} flex items-center justify-center`}>
                        <FolderOpen className="w-6 h-6 text-white" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => e.preventDefault()}
                            className="text-slate-400 hover:text-white opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem 
                            onClick={(e) => e.preventDefault()}
                            className="text-slate-300 focus:bg-slate-700 focus:text-white"
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.preventDefault();
                              deleteMutation.mutate(workspace.id);
                            }}
                            className="text-red-400 focus:bg-slate-700 focus:text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {workspace.name}
                      </h3>
                      <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                        {workspace.description || 'No description'}
                      </p>

                      {/* Health Summary */}
                      <div className="text-xs mb-4 pb-4" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{metrics.completedThisWeek}</span> tasks shipped this week
                        {metrics.needsReview > 0 && (
                          <>
                            {' · '}
                            <span className="text-amber-400 font-medium">{metrics.needsReview}</span> needs review
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs mt-auto">
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center" style={{ color: 'var(--text-secondary)' }}>
                            <FolderKanban className="w-3.5 h-3.5 mr-1" />
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{workspace.project_count || 0}</span>
                            <span className="ml-1">campaigns</span>
                          </span>
                          <span className="flex items-center" style={{ color: 'var(--text-secondary)' }}>
                            <Users className="w-3.5 h-3.5 mr-1" />
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{workspace.member_count || 0}</span>
                            <span className="ml-1">teammates</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      <AIOnboardingWizard
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}