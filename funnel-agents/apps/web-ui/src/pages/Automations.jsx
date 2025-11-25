import { useState, useMemo } from 'react';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";


import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GitBranch, Plus, Play, Pause, Trash2, Copy,
  MoreVertical, Clock, CheckCircle2, XCircle,
  Zap, Activity, Edit,
  Mail, Bell, Database, Webhook, Code
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';

const TRIGGER_TYPES = [
  { value: 'schedule', label: 'Schedule', icon: Clock, description: 'Run on a schedule (daily, weekly, etc.)' },
  { value: 'webhook', label: 'Webhook', icon: Webhook, description: 'Trigger via external webhook' },
  { value: 'lead_created', label: 'New Lead', icon: Mail, description: 'When a new lead is created' },
  { value: 'task_completed', label: 'Task Completed', icon: CheckCircle2, description: 'When a task completes' },
  { value: 'campaign_started', label: 'Campaign Started', icon: Activity, description: 'When a campaign starts' },
  { value: 'custom', label: 'Custom Event', icon: Code, description: 'Custom trigger condition' },
];

const ACTION_TYPES = [
  { value: 'run_agent', label: 'Run Agent', icon: Zap },
  { value: 'create_task', label: 'Create Task', icon: CheckCircle2 },
  { value: 'send_email', label: 'Send Email', icon: Mail },
  { value: 'send_notification', label: 'Send Notification', icon: Bell },
  { value: 'update_lead', label: 'Update Lead', icon: Database },
  { value: 'webhook', label: 'Call Webhook', icon: Webhook },
];

export default function Automations() {
  const [viewMode, setViewMode] = useState('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAutomation, setNewAutomation] = useState({
    name: '',
    trigger_type: 'schedule',
    trigger_config: {},
    actions: [],
    enabled: true,
    description: ''
  });

  const queryClient = useQueryClient();

  // Fetch automations (using Workflow entity as proxy)
  const { data: automations = [], isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      try {
        return await client.get('/api/automations/workflows?sort=-created_date') || [];
      } catch (err) {
        console.error('Failed to fetch automations:', err);
        return [];
      }
    },
    initialData: [],
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      try {
        return await client.get('/api/agents') || [];
      } catch (err) {
        console.error('Failed to fetch agents:', err);
        return [];
      }
    },
    initialData: [],
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        return await client.get('/api/tasks?sort=-created_date&limit=100') || [];
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        return [];
      }
    },
    initialData: [],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => client.post('/api/automations/workflows', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setCreateModalOpen(false);
      toast.success('Automation created successfully');
      setNewAutomation({ name: '', trigger_type: 'schedule', trigger_config: {}, actions: [], enabled: true, description: '' });
    },
    onError: () => {
      toast.error('Failed to create automation');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => client.patch(`/api/automations/workflows/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Automation updated');
    },
    onError: () => {
      toast.error('Failed to update automation');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => client.delete(`/api/automations/workflows/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Automation deleted');
    },
    onError: () => {
      toast.error('Failed to delete automation');
    },
  });

  // Filter automations
  const filteredAutomations = useMemo(() => {
    let filtered = automations;

    if (searchQuery) {
      filtered = filtered.filter(auto =>
        auto.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        auto.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (viewMode === 'active') {
      filtered = filtered.filter(auto => auto.status === 'active' || auto.enabled);
    } else if (viewMode === 'paused') {
      filtered = filtered.filter(auto => auto.status === 'paused' || !auto.enabled);
    }

    return filtered;
  }, [automations, searchQuery, viewMode]);

  // Calculate statistics
  const stats = useMemo(() => {
    const active = automations.filter(a => a.status === 'active' || a.enabled).length;
    const paused = automations.filter(a => a.status === 'paused' || !a.enabled).length;
    const totalRuns = automations.reduce((sum, a) => sum + (a.run_count || 0), 0);
    const successfulRuns = automations.reduce((sum, a) => sum + (a.success_count || 0), 0);

    return { active, paused, total: automations.length, totalRuns, successfulRuns };
  }, [automations]);

  // Handlers
  const handleToggleAutomation = (automation) => {
    const newStatus = automation.enabled ? false : true;
    updateMutation.mutate({
      id: automation.id,
      data: { enabled: newStatus, status: newStatus ? 'active' : 'paused' }
    });
  };

  const handleDeleteAutomation = (id) => {
    if (window.confirm('Are you sure you want to delete this automation?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDuplicateAutomation = (automation) => {
    const duplicate = {
      ...automation,
      name: `${automation.name} (Copy)`,
      id: undefined,
      created_date: undefined,
      run_count: 0,
      success_count: 0,
    };
    createMutation.mutate(duplicate);
  };

  const handleCreateAutomation = () => {
    if (!newAutomation.name) {
      toast.error('Automation name is required');
      return;
    }

    createMutation.mutate(newAutomation);
  };

  const handleViewDetails = (automation) => {
    setSelectedAutomation(automation);
    setDetailsOpen(true);
  };

  // Get execution history (mock data - in production would fetch from logs)
  const getExecutionHistory = (automation) => {
    const mockHistory = [];
    const count = Math.min(automation.run_count || 0, 10);

    for (let i = 0; i < count; i++) {
      mockHistory.push({
        id: `exec-${i}`,
        timestamp: new Date(Date.now() - i * 3600000 * 24),
        status: Math.random() > 0.1 ? 'success' : 'failed',
        duration: Math.floor(Math.random() * 5000) + 1000,
        error: Math.random() > 0.1 ? null : 'Connection timeout'
      });
    }

    return mockHistory;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold text-white">Automations</h1>
          <p className="text-slate-400 mt-1">
            Create workflows that run automatically based on triggers and schedules
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Automation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border-blue-800/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Total Automations</span>
                <GitBranch className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.total}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-green-900/20 to-green-900/5 border-green-800/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Active</span>
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.active}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-orange-900/20 to-orange-900/5 border-orange-800/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Paused</span>
                <Pause className="w-5 h-5 text-orange-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.paused}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border-purple-800/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Total Runs</span>
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.totalRuns.toLocaleString()}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters & Search */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder="Search automations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                onClick={() => setViewMode('all')}
                className={viewMode === 'all' ? 'bg-blue-600' : 'border-slate-700 text-slate-400'}
              >
                All
              </Button>
              <Button
                variant={viewMode === 'active' ? 'default' : 'outline'}
                onClick={() => setViewMode('active')}
                className={viewMode === 'active' ? 'bg-blue-600' : 'border-slate-700 text-slate-400'}
              >
                Active
              </Button>
              <Button
                variant={viewMode === 'paused' ? 'default' : 'outline'}
                onClick={() => setViewMode('paused')}
                className={viewMode === 'paused' ? 'bg-blue-600' : 'border-slate-700 text-slate-400'}
              >
                Paused
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automations List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading automations...</p>
        </div>
      ) : filteredAutomations.length === 0 && automations.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 mx-auto mb-6 flex items-center justify-center">
            <GitBranch className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No automations yet</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Create your first automation to run tasks automatically based on triggers and schedules
          </p>
          <Button onClick={() => setCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create First Automation
          </Button>
        </Card>
      ) : filteredAutomations.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800 p-12 text-center">
          <p className="text-slate-400">No automations match your filters</p>
          <Button
            variant="outline"
            onClick={() => { setSearchQuery(''); setViewMode('all'); }}
            className="mt-4 border-slate-700"
          >
            Clear Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAutomations.map((automation, index) => {
            const triggerType = TRIGGER_TYPES.find(t => t.value === automation.trigger_type);
            const TriggerIcon = triggerType?.icon || GitBranch;
            const isActive = automation.status === 'active' || automation.enabled;
            const successRate = automation.run_count > 0
              ? ((automation.success_count || 0) / automation.run_count * 100).toFixed(0)
              : 0;

            return (
              <motion.div
                key={automation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`bg-slate-900 border-slate-800 hover:border-slate-700 transition-all ${
                  isActive ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-slate-700'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg ${
                          isActive ? 'bg-green-500/10' : 'bg-slate-700/50'
                        }`}>
                          <TriggerIcon className={`w-5 h-5 ${
                            isActive ? 'text-green-400' : 'text-slate-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-white text-lg truncate">{automation.name}</CardTitle>
                            <Badge className={isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}>
                              {isActive ? 'Active' : 'Paused'}
                            </Badge>
                          </div>
                          <CardDescription className="text-slate-400 line-clamp-2">
                            {automation.description || triggerType?.description || 'No description'}
                          </CardDescription>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-900 border-slate-700" align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(automation)}>
                            <Activity className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedAutomation(automation);
                            setEditModalOpen(true);
                          }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleAutomation(automation)}>
                            {isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                            {isActive ? 'Pause' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateAutomation(automation)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-700" />
                          <DropdownMenuItem onClick={() => handleDeleteAutomation(automation.id)} className="text-red-400">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Total Runs</div>
                        <div className="text-lg font-semibold text-white">{automation.run_count || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Success Rate</div>
                        <div className="text-lg font-semibold text-green-400">{successRate}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Last Run</div>
                        <div className="text-sm text-white">
                          {automation.last_run ? format(new Date(automation.last_run), 'MMM dd') : 'Never'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>{triggerType?.label || 'Unknown trigger'}</span>
                      </div>
                      <Button
                        onClick={() => handleViewDetails(automation)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        View Logs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Automation Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Automation</DialogTitle>
            <DialogDescription className="text-slate-400">
              Set up a workflow that runs automatically
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Automation Name</Label>
                <Input
                  placeholder="e.g., Send welcome email to new leads"
                  value={newAutomation.name}
                  onChange={(e) => setNewAutomation(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  placeholder="What does this automation do?"
                  value={newAutomation.description}
                  onChange={(e) => setNewAutomation(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700 text-white h-20"
                />
              </div>
            </div>

            {/* Trigger Configuration */}
            <div className="space-y-4">
              <Label className="text-lg">Trigger</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TRIGGER_TYPES.map((trigger) => {
                  const Icon = trigger.icon;
                  const isSelected = newAutomation.trigger_type === trigger.value;

                  return (
                    <button
                      key={trigger.value}
                      onClick={() => setNewAutomation(prev => ({ ...prev, trigger_type: trigger.value }))}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                        <div>
                          <div className="font-medium text-white mb-1">{trigger.label}</div>
                          <div className="text-xs text-slate-400">{trigger.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schedule Configuration */}
            {newAutomation.trigger_type === 'schedule' && (
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Select defaultValue="daily">
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="hourly">Every Hour</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom Cron</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
              <div>
                <div className="font-medium text-white mb-1">Enable automation</div>
                <div className="text-sm text-slate-400">Start running this automation immediately</div>
              </div>
              <Switch
                checked={newAutomation.enabled}
                onCheckedChange={(checked) => setNewAutomation(prev => ({ ...prev, enabled: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button onClick={handleCreateAutomation} className="bg-blue-600 hover:bg-blue-700">
              Create Automation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAutomation?.name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Execution history and performance metrics
            </DialogDescription>
          </DialogHeader>

          {selectedAutomation && (
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="bg-slate-800 border border-slate-700">
                <TabsTrigger value="history">Execution History</TabsTrigger>
                <TabsTrigger value="metrics">Performance</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="space-y-4 mt-4">
                <div className="space-y-2">
                  {getExecutionHistory(selectedAutomation).map((exec) => (
                    <div key={exec.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {exec.status === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400" />
                          )}
                          <div>
                            <div className="text-white font-medium">
                              {format(exec.timestamp, 'MMM dd, yyyy HH:mm')}
                            </div>
                            {exec.error && (
                              <div className="text-sm text-red-400">{exec.error}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-slate-400">
                          {(exec.duration / 1000).toFixed(2)}s
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="metrics" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6">
                      <div className="text-slate-400 text-sm mb-2">Success Rate</div>
                      <div className="text-3xl font-bold text-white">
                        {selectedAutomation.run_count > 0
                          ? ((selectedAutomation.success_count || 0) / selectedAutomation.run_count * 100).toFixed(0)
                          : 0}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6">
                      <div className="text-slate-400 text-sm mb-2">Total Runs</div>
                      <div className="text-3xl font-bold text-white">{selectedAutomation.run_count || 0}</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="config" className="mt-4">
                <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Trigger Type</div>
                    <div className="text-white">{selectedAutomation.trigger_type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Status</div>
                    <Badge className={
                      selectedAutomation.enabled
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-slate-500/20 text-slate-400'
                    }>
                      {selectedAutomation.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)} className="border-slate-700">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
