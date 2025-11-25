import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, MessageSquare, CheckCircle2, XCircle, TrendingDown, UserPlus, Target } from 'lucide-react';

export default function TriggerConfig({ workflow, onUpdateTrigger }) {
  const triggerTypes = [
    { value: 'manual', label: 'Manual', icon: Clock, description: 'Run manually' },
    { value: 'schedule', label: 'Schedule', icon: Clock, description: 'Run on a schedule' },
    { value: 'client_feedback', label: 'Client Feedback', icon: MessageSquare, description: 'When feedback is submitted' },
    { value: 'task_completed', label: 'Task Completed', icon: CheckCircle2, description: 'When a task completes' },
    { value: 'task_failed', label: 'Task Failed', icon: XCircle, description: 'When a task fails' },
    { value: 'agent_performance', label: 'Agent Performance', icon: TrendingDown, description: 'When performance drops' },
    { value: 'new_lead', label: 'New Lead', icon: UserPlus, description: 'When a new lead is added' },
    { value: 'campaign_milestone', label: 'Campaign Milestone', icon: Target, description: 'Campaign reaches milestone' },
  ];

  const currentTrigger = workflow.trigger || { type: 'manual', config: {}, conditions: [] };
  const selectedType = triggerTypes.find(t => t.type === currentTrigger.type) || triggerTypes[0];
  const Icon = selectedType.icon;

  const handleUpdateTrigger = (updates) => {
    onUpdateTrigger({
      ...currentTrigger,
      ...updates
    });
  };

  const handleAddCondition = () => {
    const newConditions = [
      ...(currentTrigger.conditions || []),
      { field: '', operator: 'equals', value: '' }
    ];
    handleUpdateTrigger({ conditions: newConditions });
  };

  const handleUpdateCondition = (index, updates) => {
    const newConditions = [...(currentTrigger.conditions || [])];
    newConditions[index] = { ...newConditions[index], ...updates };
    handleUpdateTrigger({ conditions: newConditions });
  };

  const handleRemoveCondition = (index) => {
    const newConditions = currentTrigger.conditions.filter((_, i) => i !== index);
    handleUpdateTrigger({ conditions: newConditions });
  };

  return (
    <Card className="p-6" style={{ 
      backgroundColor: 'var(--bg-card)', 
      border: '1px solid var(--border-subtle)' 
    }}>
      <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Workflow Trigger
      </h3>

      {/* Trigger Type Selection */}
      <div className="space-y-4">
        <div>
          <Label className="text-xs mb-2">Trigger Type</Label>
          <Select
            value={currentTrigger.type}
            onValueChange={(value) => handleUpdateTrigger({ type: value })}
          >
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {triggerTypes.map((type) => {
                const TypeIcon = type.icon;
                return (
                  <SelectItem 
                    key={type.value} 
                    value={type.value}
                    className="text-slate-300 focus:bg-slate-700 focus:text-white"
                  >
                    <div className="flex items-center space-x-2">
                      <TypeIcon className="w-4 h-4" />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {selectedType.description}
          </p>
        </div>

        {/* Schedule Config */}
        {currentTrigger.type === 'schedule' && (
          <div>
            <Label className="text-xs mb-2">Schedule (Cron Expression)</Label>
            <Input
              value={currentTrigger.config?.cron || ''}
              onChange={(e) => handleUpdateTrigger({ config: { cron: e.target.value } })}
              placeholder="0 9 * * *"
              className="bg-slate-800/50 border-slate-700 text-white"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Example: "0 9 * * *" runs daily at 9am
            </p>
          </div>
        )}

        {/* Conditions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs">Trigger Conditions</Label>
            <button
              onClick={handleAddCondition}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              + Add Condition
            </button>
          </div>

          {currentTrigger.conditions && currentTrigger.conditions.length > 0 ? (
            <div className="space-y-2">
              {currentTrigger.conditions.map((condition, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={condition.field}
                    onChange={(e) => handleUpdateCondition(index, { field: e.target.value })}
                    placeholder="Field"
                    className="bg-slate-800/50 border-slate-700 text-white text-xs flex-1"
                  />
                  <Select
                    value={condition.operator}
                    onValueChange={(value) => handleUpdateCondition(index, { operator: value })}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white text-xs w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="equals" className="text-slate-300">Equals</SelectItem>
                      <SelectItem value="not_equals" className="text-slate-300">Not Equals</SelectItem>
                      <SelectItem value="greater_than" className="text-slate-300">&gt;</SelectItem>
                      <SelectItem value="less_than" className="text-slate-300">&lt;</SelectItem>
                      <SelectItem value="contains" className="text-slate-300">Contains</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={condition.value}
                    onChange={(e) => handleUpdateCondition(index, { value: e.target.value })}
                    placeholder="Value"
                    className="bg-slate-800/50 border-slate-700 text-white text-xs flex-1"
                  />
                  <button
                    onClick={() => handleRemoveCondition(index)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
              No conditions. Workflow will trigger on any {selectedType.label.toLowerCase()} event.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}