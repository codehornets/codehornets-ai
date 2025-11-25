import { useState } from 'react';
import { X, Users, Mail, Clock, GitMerge, Webhook, MessageSquare, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import client from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

const nodeCategories = {
  actions: [
    { type: 'agent', icon: Users, label: 'AI Agent Task', description: 'Execute an AI agent with specific instructions', color: 'text-blue-400' },
    { type: 'email', icon: Mail, label: 'Send Email', description: 'Send automated emails to contacts', color: 'text-pink-400' },
    { type: 'communication', icon: MessageSquare, label: 'Log Communication', description: 'Record a call, meeting, or note', color: 'text-purple-400' },
    { type: 'task', icon: CheckCircle, label: 'Create Task', description: 'Create a task for a campaign', color: 'text-green-400' },
  ],
  logic: [
    { type: 'condition', icon: GitMerge, label: 'Condition', description: 'Branch based on criteria', color: 'text-amber-400' },
    { type: 'delay', icon: Clock, label: 'Wait/Delay', description: 'Wait before continuing', color: 'text-slate-400' },
  ],
  integrations: [
    { type: 'webhook', icon: Webhook, label: 'Webhook', description: 'Call external API', color: 'text-cyan-400' },
  ],
};

export default function EnhancedAddNodePanel({ onAddNode, onClose, workflow }) {
  const [selectedType, setSelectedType] = useState(null);
  const [config, setConfig] = useState({});
  const [activeCategory, setActiveCategory] = useState('actions');

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
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      try {
        return await client.get('/api/crm/contacts') || [];
      } catch (err) {
        console.error('Failed to fetch contacts:', err);
        return [];
      }
    },
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      try {
        return await client.get('/api/campaigns') || [];
      } catch (err) {
        console.error('Failed to fetch campaigns:', err);
        return [];
      }
    },
  });

  const handleAdd = () => {
    if (selectedType) {
      onAddNode(selectedType, config);
      setConfig({});
      setSelectedType(null);
    }
  };

  const allNodeTypes = [...nodeCategories.actions, ...nodeCategories.logic, ...nodeCategories.integrations];

  return (
    <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-30 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-3xl max-h-[85vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Add Workflow Step</h3>
            <Button size="icon" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-slate-400 mt-1">Choose an action, logic, or integration node</p>
        </div>

        <div className="p-6">
          {!selectedType ? (
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="grid grid-cols-3 w-full mb-6 bg-slate-900/50">
                <TabsTrigger value="actions">Actions</TabsTrigger>
                <TabsTrigger value="logic">Logic</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
              </TabsList>

              <TabsContent value="actions" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {nodeCategories.actions && nodeCategories.actions.map((nodeType) => {
                  const Icon = nodeType.icon;
                  return (
                    <button
                      key={nodeType.type}
                      onClick={() => setSelectedType(nodeType.type)}
                      className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-all text-left group"
                    >
                      <Icon className={`w-8 h-8 ${nodeType.color} mb-3`} />
                      <h4 className="text-white font-semibold mb-1">{nodeType.label}</h4>
                      <p className="text-sm text-slate-400">{nodeType.description}</p>
                    </button>
                  );
                })}
              </TabsContent>

              <TabsContent value="logic" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {nodeCategories.logic && nodeCategories.logic.map((nodeType) => {
                  const Icon = nodeType.icon;
                  return (
                    <button
                      key={nodeType.type}
                      onClick={() => setSelectedType(nodeType.type)}
                      className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-all text-left group"
                    >
                      <Icon className={`w-8 h-8 ${nodeType.color} mb-3`} />
                      <h4 className="text-white font-semibold mb-1">{nodeType.label}</h4>
                      <p className="text-sm text-slate-400">{nodeType.description}</p>
                    </button>
                  );
                })}
              </TabsContent>

              <TabsContent value="integrations" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {nodeCategories.integrations && nodeCategories.integrations.map((nodeType) => {
                  const Icon = nodeType.icon;
                  return (
                    <button
                      key={nodeType.type}
                      onClick={() => setSelectedType(nodeType.type)}
                      className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-all text-left group"
                    >
                      <Icon className={`w-8 h-8 ${nodeType.color} mb-3`} />
                      <h4 className="text-white font-semibold mb-1">{nodeType.label}</h4>
                      <p className="text-sm text-slate-400">{nodeType.description}</p>
                    </button>
                  );
                })}
              </TabsContent>
            </Tabs>
          ) : selectedType ? (
            <div className="space-y-4">
              {/* Agent Node Config */}
              {selectedType === 'agent' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">Select Agent *</Label>
                    <Select
                      value={config.agent_id}
                      onValueChange={(v) => {
                        const agent = agents.find(a => a.id === v);
                        setConfig({ ...config, agent_id: v, name: agent?.name, agent_role: agent?.role });
                      }}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                        <SelectValue placeholder="Choose an agent" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {agents && agents.map(agent => (
                          <SelectItem key={agent.id} value={agent.id} className="text-slate-300 focus:bg-slate-700 focus:text-white">
                            <div className="flex items-center gap-2">
                              <span>{agent.name}</span>
                              <Badge variant="outline" className="text-xs">{agent.domain}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Task Instructions</Label>
                    <Textarea
                      placeholder="What should this agent do in this workflow step?"
                      value={config.instructions || ''}
                      onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
                      className="bg-slate-900/50 border-slate-700 text-white h-24"
                    />
                  </div>
                </>
              )}

              {/* Email Node Config */}
              {selectedType === 'email' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">Email Subject *</Label>
                    <Input
                      placeholder="Subject line"
                      value={config.subject || ''}
                      onChange={(e) => setConfig({ ...config, subject: e.target.value, name: 'Send: ' + e.target.value })}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Email Body *</Label>
                    <Textarea
                      placeholder="Email content..."
                      value={config.body || ''}
                      onChange={(e) => setConfig({ ...config, body: e.target.value })}
                      className="bg-slate-900/50 border-slate-700 text-white h-32"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Recipient (Optional)</Label>
                    <Select
                      value={config.contact_id}
                      onValueChange={(v) => setConfig({ ...config, contact_id: v })}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                        <SelectValue placeholder="Use workflow data or select contact" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {contacts && contacts.map(c => (
                          <SelectItem key={c.id} value={c.id} className="text-slate-300 focus:bg-slate-700 focus:text-white">
                            {c.full_name} ({c.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Communication Log Node Config */}
              {selectedType === 'communication' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">Communication Type *</Label>
                    <Select
                      value={config.comm_type}
                      onValueChange={(v) => setConfig({ ...config, comm_type: v, name: `Log ${v}` })}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="note">Note</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Subject/Title *</Label>
                    <Input
                      placeholder="Communication subject"
                      value={config.subject || ''}
                      onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                </>
              )}

              {/* Task Creation Node Config */}
              {selectedType === 'task' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">Task Title *</Label>
                    <Input
                      placeholder="Task name"
                      value={config.task_title || ''}
                      onChange={(e) => setConfig({ ...config, task_title: e.target.value, name: 'Create: ' + e.target.value })}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Assign to Agent *</Label>
                    <Select
                      value={config.agent_id}
                      onValueChange={(v) => {
                        const agent = agents.find(a => a.id === v);
                        setConfig({ ...config, agent_id: v, agent_name: agent?.name });
                      }}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                        <SelectValue placeholder="Choose agent" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {agents && agents.map(agent => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Campaign (Optional)</Label>
                    <Select
                      value={config.campaign_id}
                      onValueChange={(v) => setConfig({ ...config, campaign_id: v })}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                        <SelectValue placeholder="Select campaign" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {campaigns && campaigns.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Condition Node Config */}
              {selectedType === 'condition' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">Condition Logic *</Label>
                    <Input
                      placeholder="e.g., task.score > 80"
                      value={config.condition || ''}
                      onChange={(e) => setConfig({ ...config, condition: e.target.value, name: 'If: ' + e.target.value })}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                    <p className="text-xs text-slate-500">Use variables from previous steps</p>
                  </div>
                </>
              )}

              {/* Delay Node Config */}
              {selectedType === 'delay' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">Delay Duration *</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="5"
                        value={config.duration || ''}
                        onChange={(e) => setConfig({ ...config, duration: e.target.value })}
                        className="bg-slate-900/50 border-slate-700 text-white flex-1"
                      />
                      <Select
                        value={config.unit || 'minutes'}
                        onValueChange={(v) => setConfig({ ...config, unit: v, name: `Wait ${config.duration || ''} ${v}` })}
                      >
                        <SelectTrigger className="w-32 bg-slate-900/50 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="minutes">Minutes</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Webhook Node Config */}
              {selectedType === 'webhook' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">Webhook URL *</Label>
                    <Input
                      placeholder="https://api.example.com/webhook"
                      value={config.url || ''}
                      onChange={(e) => setConfig({ ...config, url: e.target.value, name: 'Webhook' })}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Method</Label>
                    <Select
                      value={config.method || 'POST'}
                      onValueChange={(v) => setConfig({ ...config, method: v })}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-700 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedType(null)} 
                  className="border-slate-700 text-slate-300 hover:bg-slate-700"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleAdd} 
                  disabled={!config.name} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add to Workflow
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}