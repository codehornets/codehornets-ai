import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GitBranch, Plus, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function AddToAutomationModal({ open, onOpenChange, agent, onAdd }) {
  const [activeTab, setActiveTab] = useState('existing');
  const [_selectedAutomation, _setSelectedAutomation] = useState('');
  const [newAutomation, setNewAutomation] = useState({
    name: '',
    type: 'recurring',
    trigger: 'weekly',
  });

  const existingAutomations = [
    { id: '1', name: 'Weekly Campaign Review', description: 'Review campaign performance every Monday', agents: 3, trigger: 'Every Monday', frequency: '9:00 AM' },
    { id: '2', name: 'New Lead Nurture', description: 'Automated lead scoring and follow-up', agents: 5, trigger: 'On new lead created', frequency: 'Immediate' },
    { id: '3', name: 'Pre-Launch Research', description: 'Run market research before campaign launch', agents: 2, trigger: 'On campaign status change', frequency: 'Event-based' },
  ];

  const [attachedIds, setAttachedIds] = useState(new Set());

  const handleAttach = (automation) => {
    setAttachedIds(prev => new Set([...prev, automation.id]));
    onAdd({ automation_id: automation.id, agent_id: agent.id });
    toast.success(`Added ${agent.name} to ${automation.name}`);
  };

  const handleCreateAndAttach = () => {
    onAdd({ ...newAutomation, agent_id: agent.id });
    setNewAutomation({ name: '', type: 'recurring', trigger: 'weekly' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add {agent?.name} to Automation</DialogTitle>
          <DialogDescription className="text-slate-400">
            Plug this agent into repeatable workflows
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="existing" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white">
              Existing Automations
            </TabsTrigger>
            <TabsTrigger value="new" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white">
              Create New
            </TabsTrigger>
          </TabsList>

          {/* Existing Automations Tab */}
          <TabsContent value="existing" className="space-y-3 mt-4">
            {existingAutomations.map((automation) => (
              <div
                key={automation.id}
                className="p-4 bg-slate-800/30 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mt-1">
                      <GitBranch className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{automation.name}</h4>
                      <p className="text-sm text-slate-400 mt-1">{automation.description}</p>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                          {automation.trigger} · {automation.frequency}
                        </span>
                        <p className="text-xs text-slate-500">{automation.agents} agents</p>
                      </div>
                    </div>
                  </div>
                  {attachedIds.has(automation.id) ? (
                    <span className="text-xs px-3 py-2 rounded-lg bg-green-500/20 text-green-400 ml-4 font-medium">
                      Attached
                    </span>
                  ) : (
                    <Button
                      onClick={() => handleAttach(automation)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 ml-4"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Attach
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Create New Automation Tab */}
          <TabsContent value="new" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Automation Name</Label>
              <Input
                placeholder="e.g., Content Production Pipeline"
                value={newAutomation.name}
                onChange={(e) => setNewAutomation({ ...newAutomation, name: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <RadioGroup value={newAutomation.type} onValueChange={(v) => setNewAutomation({ ...newAutomation, type: v })}>
                <div className="flex items-center space-x-2 p-3 bg-slate-800/30 rounded-lg">
                  <RadioGroupItem value="recurring" id="recurring" />
                  <Label htmlFor="recurring" className="flex-1 cursor-pointer">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-white">Recurring (runs on schedule)</span>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 bg-slate-800/30 rounded-lg">
                  <RadioGroupItem value="event" id="event" />
                  <Label htmlFor="event" className="flex-1 cursor-pointer">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span className="text-white">Event-based (triggered by action)</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {newAutomation.type === 'recurring' && (
              <div className="space-y-2">
                <Label>Schedule</Label>
                <RadioGroup value={newAutomation.trigger} onValueChange={(v) => setNewAutomation({ ...newAutomation, trigger: v })}>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2 p-3 bg-slate-800/30 rounded-lg">
                      <RadioGroupItem value="daily" id="daily" />
                      <Label htmlFor="daily" className="cursor-pointer text-white text-sm">Every day</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-slate-800/30 rounded-lg">
                      <RadioGroupItem value="weekly" id="weekly" />
                      <Label htmlFor="weekly" className="cursor-pointer text-white text-sm">Every Monday</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-slate-800/30 rounded-lg">
                      <RadioGroupItem value="monthly" id="monthly" />
                      <Label htmlFor="monthly" className="cursor-pointer text-white text-sm">Monthly</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}

            {newAutomation.type === 'event' && (
              <div className="space-y-2">
                <Label>Trigger</Label>
                <RadioGroup value={newAutomation.trigger} onValueChange={(v) => setNewAutomation({ ...newAutomation, trigger: v })}>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-3 bg-slate-800/30 rounded-lg">
                      <RadioGroupItem value="new_campaign" id="new_campaign" />
                      <Label htmlFor="new_campaign" className="cursor-pointer text-white text-sm">When a new campaign is created</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-slate-800/30 rounded-lg">
                      <RadioGroupItem value="lead_score" id="lead_score" />
                      <Label htmlFor="lead_score" className="cursor-pointer text-white text-sm">When a lead score crosses threshold</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
            Cancel
          </Button>
          {activeTab === 'new' && (
            <Button 
              onClick={handleCreateAndAttach}
              disabled={!newAutomation.name || !newAutomation.trigger}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create & Attach Agent
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}