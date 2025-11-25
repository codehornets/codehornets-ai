import { useState } from 'react';
import { X, Users, Zap, GitMerge, Clock, Mail, Webhook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import client from '@/api/client';
import { useQuery } from '@tanstack/react-query';

const nodeTypes = [
  { type: 'agent', icon: Users, label: 'AI Agent', description: 'Run an AI agent' },
  { type: 'trigger', icon: Zap, label: 'Trigger', description: 'Start the workflow' },
  { type: 'condition', icon: GitMerge, label: 'Condition', description: 'Branch based on logic' },
  { type: 'delay', icon: Clock, label: 'Delay', description: 'Wait before continuing' },
  { type: 'email', icon: Mail, label: 'Send Email', description: 'Send an email' },
  { type: 'webhook', icon: Webhook, label: 'Webhook', description: 'Call external API' },
];

export default function AddNodePanel({ onAddNode, onClose }) {
  const [selectedType, setSelectedType] = useState(null);
  const [config, setConfig] = useState({});

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

  const handleAdd = () => {
    if (selectedType) {
      onAddNode(selectedType, config);
      setConfig({});
      setSelectedType(null);
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-30 flex items-center justify-center">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Add Node</h3>
          <Button size="icon" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {!selectedType ? (
          <div className="grid grid-cols-2 gap-4">
            {nodeTypes.map((nodeType) => {
              const Icon = nodeType.icon;
              return (
                <button
                  key={nodeType.type}
                  onClick={() => setSelectedType(nodeType.type)}
                  className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-colors text-left group"
                >
                  <Icon className="w-8 h-8 text-blue-400 mb-3" />
                  <h4 className="text-white font-semibold mb-1">{nodeType.label}</h4>
                  <p className="text-sm text-slate-400">{nodeType.description}</p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {selectedType === 'agent' && (
              <>
                <div className="space-y-2">
                  <Label>Select Agent</Label>
                  <Select
                    value={config.agent_id}
                    onValueChange={(v) => {
                      const agent = agents.find(a => a.id === v);
                      setConfig({ ...config, agent_id: v, name: agent?.name });
                    }}
                  >
                    <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                      <SelectValue placeholder="Choose an agent" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {agents.map(agent => (
                        <SelectItem key={agent.id} value={agent.id} className="text-slate-300 focus:bg-slate-700 focus:text-white">
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Textarea
                    placeholder="What should this agent do?"
                    value={config.instructions || ''}
                    onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
              </>
            )}

            {selectedType === 'trigger' && (
              <>
                <div className="space-y-2">
                  <Label>Trigger Type</Label>
                  <Select
                    value={config.trigger_type}
                    onValueChange={(v) => setConfig({ ...config, trigger_type: v, name: `${v} trigger` })}
                  >
                    <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                      <SelectValue placeholder="Choose trigger type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="manual" className="text-slate-300 focus:bg-slate-700 focus:text-white">Manual</SelectItem>
                      <SelectItem value="schedule" className="text-slate-300 focus:bg-slate-700 focus:text-white">Schedule (Cron)</SelectItem>
                      <SelectItem value="webhook" className="text-slate-300 focus:bg-slate-700 focus:text-white">Webhook</SelectItem>
                      <SelectItem value="event" className="text-slate-300 focus:bg-slate-700 focus:text-white">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {selectedType === 'condition' && (
              <>
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Input
                    placeholder="e.g., approval_rate > 80"
                    value={config.condition || ''}
                    onChange={(e) => setConfig({ ...config, condition: e.target.value, name: 'Condition' })}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
              </>
            )}

            {selectedType === 'delay' && (
              <>
                <div className="space-y-2">
                  <Label>Delay Duration</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="5"
                      value={config.duration || ''}
                      onChange={(e) => setConfig({ ...config, duration: e.target.value })}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                    <Select
                      value={config.unit || 'minutes'}
                      onValueChange={(v) => setConfig({ ...config, unit: v, name: `Wait ${config.duration || ''} ${v}` })}
                    >
                      <SelectTrigger className="w-32 bg-slate-900/50 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="seconds" className="text-slate-300 focus:bg-slate-700 focus:text-white">Seconds</SelectItem>
                        <SelectItem value="minutes" className="text-slate-300 focus:bg-slate-700 focus:text-white">Minutes</SelectItem>
                        <SelectItem value="hours" className="text-slate-300 focus:bg-slate-700 focus:text-white">Hours</SelectItem>
                        <SelectItem value="days" className="text-slate-300 focus:bg-slate-700 focus:text-white">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {selectedType === 'email' && (
              <>
                <div className="space-y-2">
                  <Label>Email Template</Label>
                  <Input
                    placeholder="Template name or ID"
                    value={config.template || ''}
                    onChange={(e) => setConfig({ ...config, template: e.target.value, name: 'Send email' })}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
              </>
            )}

            {selectedType === 'webhook' && (
              <>
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <Input
                    placeholder="https://api.example.com/webhook"
                    value={config.url || ''}
                    onChange={(e) => setConfig({ ...config, url: e.target.value, name: 'Call webhook' })}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setSelectedType(null)} className="border-slate-700 text-slate-300">
                Back
              </Button>
              <Button onClick={handleAdd} disabled={!config.name} className="bg-blue-600 hover:bg-blue-700">
                Add Node
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}