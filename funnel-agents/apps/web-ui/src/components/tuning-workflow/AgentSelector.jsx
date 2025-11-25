import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, Users, AlertTriangle } from 'lucide-react';

export default function AgentSelector({ agents, selectedAgents, onSelectAgents, tasks, feedback }) {
  const [searchQuery, setSearchQuery] = useState('');

  const enrichedAgents = agents.map(agent => {
    const agentTasks = tasks.filter(t => t.agent_id === agent.id);
    const agentFeedback = feedback.filter(f => f.agent_id === agent.id);
    
    const completedTasks = agentTasks.filter(t => t.status === 'completed').length;
    const totalTasks = agentTasks.length;
    const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const avgFeedback = agentFeedback.length > 0
      ? agentFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / agentFeedback.length
      : 0;

    const needsTuning = successRate < 75 || avgFeedback < 3.5;

    return { ...agent, successRate, avgFeedback, needsTuning };
  });

  const filteredAgents = enrichedAgents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleAgent = (agentId) => {
    if (selectedAgents.includes(agentId)) {
      onSelectAgents(selectedAgents.filter(id => id !== agentId));
    } else {
      onSelectAgents([...selectedAgents, agentId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedAgents.length === filteredAgents.length) {
      onSelectAgents([]);
    } else {
      onSelectAgents(filteredAgents.map(a => a.id));
    }
  };

  const handleSelectNeedsTuning = () => {
    const needsTuningIds = filteredAgents.filter(a => a.needsTuning).map(a => a.id);
    onSelectAgents(needsTuningIds);
  };

  return (
    <Card className="p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center space-x-2 mb-4">
        <Users className="w-5 h-5 text-blue-400" />
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          Select Agents to Tune
        </h3>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSelectAll}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {selectedAgents.length === filteredAgents.length ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-slate-600">•</span>
          <button
            onClick={handleSelectNeedsTuning}
            className="text-xs text-orange-400 hover:text-orange-300"
          >
            Select Underperforming
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredAgents.map(agent => (
            <div
              key={agent.id}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
              onClick={() => handleToggleAgent(agent.id)}
            >
              <Checkbox
                checked={selectedAgents.includes(agent.id)}
                onCheckedChange={() => handleToggleAgent(agent.id)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {agent.name}
                  </p>
                  {agent.needsTuning && (
                    <AlertTriangle className="w-3 h-3 text-orange-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {agent.role}
                </p>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <Badge className={`text-xs ${
                  agent.successRate >= 75 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {agent.successRate.toFixed(0)}%
                </Badge>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  ⭐ {agent.avgFeedback.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-700">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {selectedAgents.length} agent{selectedAgents.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      </div>
    </Card>
  );
}