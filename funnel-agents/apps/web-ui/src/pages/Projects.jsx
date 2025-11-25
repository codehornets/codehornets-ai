import { useState, useEffect } from 'react';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, FolderKanban, Calendar, MoreVertical, Trash2, Sparkles, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import AICampaignSuggestions from '../components/campaign/AICampaignSuggestions';
import AICampaignSetup from '../components/campaign/AICampaignSetup';
import AITaskGrouping from '../components/project/AITaskGrouping';
import TemplateGallery from '../components/project/TemplateGallery';
import CreateTemplateModal from '../components/project/CreateTemplateModal';

export default function Projects() {
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [useAISetup, setUseAISetup] = useState(false);
  const [useTemplates, setUseTemplates] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState('all');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', workspace_id: '', status: 'draft', priority: 'medium', progress: 0
  });
  const queryClient = useQueryClient();

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => client.entities.Workspace.list(),
    initialData: [],
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => client.entities.Campaign.list('-created_date'),
    initialData: [],
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => client.entities.Task.list('-created_date', 200),
    initialData: [],
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['project-templates'],
    queryFn: () => client.entities.ProjectTemplate.list(),
    initialData: [],
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => client.entities.Agent.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => client.entities.Campaign.create({
      ...data,
      client_id: data.workspace_id,
    }),
    onSuccess: (newCampaign) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setCreateModalOpen(false);
      setFormData({ name: '', description: '', workspace_id: '', status: 'draft', priority: 'medium', progress: 0 });
      const workspace = workspaces.find(w => w.id === newCampaign.client_id);
      toast.success(`Campaign "${newCampaign.name}" created for ${workspace?.name || 'client'}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => client.entities.Campaign.update(id, {
      ...data,
      client_id: data.workspace_id,
    }),
    onSuccess: (updatedCampaign) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setCreateModalOpen(false);
      setEditingProject(null);
      setFormData({ name: '', description: '', workspace_id: '', status: 'draft', priority: 'medium', progress: 0 });
      toast.success(`Campaign "${updatedCampaign.name}" updated`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => client.entities.Campaign.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Campaign deleted');
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data) => client.entities.ProjectTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
      setTemplateModalOpen(false);
      toast.success('Template created successfully');
    },
  });

  const handleUseTemplate = async (template) => {
    // Create tasks from template
    const tasksToCreate = template.tasks_blueprint?.map(task => ({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      task_type: task.task_type || 'general',
      status: 'pending',
    })) || [];

    // Pre-fill form with template data
    setFormData({
      name: template.name,
      description: template.description,
      workspace_id: selectedWorkspace !== 'all' ? selectedWorkspace : '',
      status: 'planning',
      priority: 'medium',
      progress: 0,
      template_tasks: tasksToCreate,
    });

    setUseTemplates(false);
    toast.success(`Template "${template.name}" loaded`);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const workspaceId = params.get('workspace');
    if (workspaceId) setSelectedWorkspace(workspaceId);
  }, []);

  const filteredProjects = selectedWorkspace === 'all' 
    ? projects 
    : projects.filter(p => p.client_id === selectedWorkspace);
  
  const selectedClient = workspaces.find(w => w.id === selectedWorkspace);

  const statusColors = {
    draft: 'bg-slate-500/20 text-slate-400',
    planning: 'bg-yellow-500/20 text-yellow-400',
    active: 'bg-green-500/20 text-green-400',
    on_hold: 'bg-orange-500/20 text-orange-400',
    completed: 'bg-blue-500/20 text-blue-400',
    archived: 'bg-slate-500/20 text-slate-400',
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Campaigns</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            {selectedWorkspace === 'all' ? (
              <>Plan and track marketing initiatives for each client. Campaigns group agents, tasks, and automations around a single goal.</>
            ) : (
              <>
                {filteredProjects.length} {filteredProjects.length === 1 ? 'campaign' : 'campaigns'} for{' '}
                {workspaces.find(w => w.id === selectedWorkspace)?.name || 'this client'}
              </>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
            <SelectTrigger className="w-full sm:w-56 bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                All Clients
              </SelectItem>
              {workspaces.map((ws) => (
                <SelectItem key={ws.id} value={ws.id} className="text-slate-300 focus:bg-slate-700 focus:text-white">
                  {ws.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filteredProjects.length > 0 && (
            <Button 
              onClick={() => {
                if (selectedWorkspace !== 'all') {
                  setFormData(prev => ({ ...prev, workspace_id: selectedWorkspace }));
                }
                setCreateModalOpen(true);
              }} 
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">New Campaign</span>
              <span className="md:hidden">New</span>
            </Button>
          )}
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <Card className="glassmorphism-light border-slate-800/50 p-8 md:p-10 mx-auto max-w-3xl">
          <div className="text-center space-y-6">
            {/* Icon */}
            <FolderKanban className="w-14 h-14 text-slate-600 mx-auto" />

            {/* Headline */}
            <h3 className="text-xl font-semibold text-white">
              {selectedWorkspace === 'all' 
                ? 'No campaigns yet'
                : `No campaigns for ${workspaces.find(w => w.id === selectedWorkspace)?.name || 'this client'} yet`
              }
            </h3>

            {/* Definition */}
            <p className="text-slate-300 text-sm max-w-2xl mx-auto">
              A campaign is a container for <span className="font-semibold text-white">one client's</span> agents, tasks, and automations, all focused on a single objective.
            </p>

            {/* Numbered Steps */}
            <div className="max-w-xl mx-auto space-y-3 text-left">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                  1
                </div>
                <p className="text-slate-300 text-sm pt-0.5">
                  <span className="font-semibold text-white">Choose</span> a client & objective (e.g. "Q1 LinkedIn Lead Gen")
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                  2
                </div>
                <p className="text-slate-300 text-sm pt-0.5">
                  <span className="font-semibold text-white">Assign</span> AI agents (Content, Ads, Lead Qualifier, etc.)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                  3
                </div>
                <p className="text-slate-300 text-sm pt-0.5">
                  <span className="font-semibold text-white">Connect</span> tasks & automations to this campaign
                </p>
              </div>
            </div>

            {/* Primary CTA */}
            <div className="pt-2">
              <Button 
                onClick={() => {
                  if (selectedWorkspace !== 'all') {
                    setFormData(prev => ({ ...prev, workspace_id: selectedWorkspace }));
                  }
                  setCreateModalOpen(true);
                }} 
                className="bg-blue-600 hover:bg-blue-700 px-6"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </div>

            {/* Secondary Preset Option */}
            <div className="space-y-3 pt-2">
              <p className="text-xs text-slate-400">
                Or start faster with a preset like LinkedIn Lead Gen, Product Launch, or Newsletter Growth.
              </p>
              <Button 
                onClick={() => {
                  if (selectedWorkspace !== 'all') {
                    setFormData(prev => ({ ...prev, workspace_id: selectedWorkspace }));
                  }
                  setUseAISetup(true);
                  setCreateModalOpen(true);
                }}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Browse Campaign Presets
              </Button>
            </div>
          </div>
        </Card>
        ) : (
        <>
          {/* AI Task Grouping */}
          <AITaskGrouping
            tasks={tasks.filter(t => !t.campaign_id)}
            onCreateProject={(projectData) => createMutation.mutate(projectData)}
            workspaces={workspaces}
          />

          {/* AI Suggestions for Selected Client */}
          {selectedWorkspace !== 'all' && (
            <AICampaignSuggestions 
              client={selectedClient}
              campaigns={filteredProjects}
              tasks={tasks.filter(t => filteredProjects.some(p => p.id === t.campaign_id))}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {filteredProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className="p-6 transition-all group cursor-pointer"
              onClick={() => navigate(createPageUrl('CampaignDetail') + `?id=${project.id}`)}
              style={{ 
                backgroundColor: 'var(--bg-card)', 
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px'
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[project.status]}`}>
                    {project.status}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-400 hover:text-white opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(project);
                        setFormData({
                          name: project.name,
                          description: project.description || '',
                          workspace_id: project.client_id,
                          status: project.status,
                          priority: project.priority,
                          progress: project.progress || 0
                        });
                        setCreateModalOpen(true);
                      }}
                      className="text-slate-300 focus:bg-slate-700 focus:text-white"
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(project.id);
                      }}
                      className="text-red-400 focus:bg-slate-700 focus:text-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{project.name}</h3>
              <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                {project.description || 'No description'}
              </p>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {project.task_count || 0} tasks
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    project.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                    project.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    project.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {project.priority}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
          ))}
          </div>
          </>
          )}

      {/* Template Creation Modal */}
      <CreateTemplateModal
        open={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
        onSave={(data) => createTemplateMutation.mutate(data)}
      />

      <Dialog open={createModalOpen} onOpenChange={(open) => {
        setCreateModalOpen(open);
        if (!open) {
          setEditingProject(null);
          setUseAISetup(false);
          setUseTemplates(false);
          setFormData({ name: '', description: '', workspace_id: '', status: 'draft', priority: 'medium', progress: 0 });
        }
      }}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? 'Edit Campaign' : 
               useAISetup ? 'AI Campaign Setup' : 
               useTemplates ? 'Choose Template' :
               'Create New Campaign'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingProject ? 'Update campaign details' : 
               useAISetup ? 'AI will guide you through campaign setup' : 
               useTemplates ? 'Select a pre-built template or create your own' :
               'Launch a new campaign for your client'}
            </DialogDescription>
          </DialogHeader>

          {!editingProject && !useAISetup && (
            <div className="py-4 space-y-3">
              <Button
                onClick={() => setUseAISetup(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-16 text-left flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">AI-Powered Setup</p>
                    <p className="text-xs text-white/80">Get campaign suggestions with presets</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5" />
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-900 px-2 text-slate-500">or</span>
                </div>
              </div>

              <Button
                onClick={() => setUseTemplates(true)}
                variant="outline"
                className="w-full border-slate-700 text-white hover:bg-slate-800 h-12"
              >
                Browse Templates
              </Button>
            </div>
          )}

          {useTemplates && !editingProject && (
            <div className="py-4">
              <TemplateGallery
                templates={templates}
                onSelectTemplate={handleUseTemplate}
                onCreateCustom={() => setTemplateModalOpen(true)}
              />
            </div>
          )}

          {useAISetup && !editingProject && (
            <AICampaignSetup
              workspaces={workspaces}
              onComplete={(campaignData) => {
                createMutation.mutate(campaignData);
              }}
              onCancel={() => {
                setUseAISetup(false);
                setCreateModalOpen(false);
              }}
            />
          )}

          {!useAISetup && !useTemplates && (
            <>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input
                placeholder="e.g., Q1 LinkedIn Campaign"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select 
                value={formData.workspace_id} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, workspace_id: v }))}
              >
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {workspaces.map((ws) => (
                    <SelectItem key={ws.id} value={ws.id} className="text-slate-300 focus:bg-slate-700 focus:text-white">
                      {ws.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">Which client is this campaign for?</p>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Goals, target audience, and key channels..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-slate-800/50 border-slate-700 text-white h-24"
              />
              <p className="text-xs text-slate-500">This helps agents understand what this campaign is about</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="draft" className="text-slate-300 focus:bg-slate-700 focus:text-white">Draft</SelectItem>
                    <SelectItem value="planning" className="text-slate-300 focus:bg-slate-700 focus:text-white">Planning</SelectItem>
                    <SelectItem value="active" className="text-slate-300 focus:bg-slate-700 focus:text-white">Active</SelectItem>
                    <SelectItem value="on_hold" className="text-slate-300 focus:bg-slate-700 focus:text-white">On Hold</SelectItem>
                    <SelectItem value="completed" className="text-slate-300 focus:bg-slate-700 focus:text-white">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">Use Draft while setting up; switch to Active when ready</p>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v }))}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="low" className="text-slate-300 focus:bg-slate-700 focus:text-white">Low</SelectItem>
                    <SelectItem value="medium" className="text-slate-300 focus:bg-slate-700 focus:text-white">Medium</SelectItem>
                    <SelectItem value="high" className="text-slate-300 focus:bg-slate-700 focus:text-white">High</SelectItem>
                    <SelectItem value="critical" className="text-slate-300 focus:bg-slate-700 focus:text-white">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">Use High for campaigns that need attention first</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateModalOpen(false);
              setEditingProject(null);
              setUseAISetup(false);
              setFormData({ name: '', description: '', workspace_id: '', status: 'draft', priority: 'medium', progress: 0 });
            }} className="border-slate-700 text-white hover:bg-slate-800">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (editingProject) {
                  updateMutation.mutate({ id: editingProject.id, data: formData });
                } else {
                  createMutation.mutate(formData);
                }
              }} 
              disabled={!formData.name || !formData.workspace_id} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editingProject ? 'Update Campaign' : 'Create Campaign'}
            </Button>
          </DialogFooter>
          </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}