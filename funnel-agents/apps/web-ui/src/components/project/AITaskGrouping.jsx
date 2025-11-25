import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, CheckCircle2, FolderKanban, Plus } from 'lucide-react';
import client from '@/api/client';
import { toast } from 'sonner';

export default function AITaskGrouping({ tasks = [], onCreateProject, workspaces = [] }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const analyzeAndGroupTasks = async () => {
    if (tasks.length === 0) return;

    setLoading(true);
    try {
      const tasksData = tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        agent_id: t.agent_id,
        agent_name: t.agent_name,
        task_type: t.task_type,
        client_id: t.client_id,
        campaign_id: t.campaign_id,
        status: t.status,
        created_date: t.created_date,
      }));

      const result = await client.integrations.Core.InvokeLLM({
        prompt: `Analyze these tasks and suggest logical project groupings:

${JSON.stringify(tasksData, null, 2)}

Identify:
1. Common themes, clients, or objectives across tasks
2. Natural groupings based on dependencies or workflows
3. Suggested project names and descriptions
4. Which tasks belong to each project

Return ONLY valid JSON with this structure:
{
  "groups": [
    {
      "name": "Project Name",
      "description": "Why these tasks belong together",
      "reason": "Brief explanation of grouping logic",
      "task_ids": ["task_id1", "task_id2"],
      "suggested_client_id": "workspace_id or null",
      "priority": "high|medium|low",
      "estimated_completion": "2-3 weeks"
    }
  ],
  "ungrouped_tasks": ["task_id"],
  "insights": "Overall analysis of task patterns"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            groups: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  reason: { type: "string" },
                  task_ids: { type: "array", items: { type: "string" } },
                  suggested_client_id: { type: "string" },
                  priority: { type: "string" },
                  estimated_completion: { type: "string" }
                }
              }
            },
            ungrouped_tasks: { type: "array", items: { type: "string" } },
            insights: { type: "string" }
          }
        }
      });

      setSuggestions(result);
      toast.success('AI analysis complete!');
    } catch (error) {
      console.error('AI grouping error:', error);
      toast.error('Failed to analyze tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = (group) => {
    const projectData = {
      name: group.name,
      description: group.description,
      workspace_id: group.suggested_client_id || workspaces[0]?.id,
      status: 'planning',
      priority: group.priority || 'medium',
      task_ids: group.task_ids,
    };
    onCreateProject(projectData);
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Card className="glassmorphism-light border-purple-500/30 bg-purple-500/5 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">AI Task Grouping</h3>
          </div>
          <p className="text-sm text-purple-400/80">
            Automatically organize {tasks.length} tasks into logical project groups
          </p>
        </div>
        <Button
          onClick={analyzeAndGroupTasks}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Tasks
            </>
          )}
        </Button>
      </div>

      {suggestions && (
        <div className="space-y-4 mt-6">
          {/* Insights */}
          {suggestions.insights && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <p className="text-sm text-purple-300">{suggestions.insights}</p>
            </div>
          )}

          {/* Project Groups */}
          {suggestions.groups && suggestions.groups.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white">Suggested Projects ({suggestions.groups.length})</h4>
              {suggestions.groups.map((group, idx) => {
                const groupTasks = tasks.filter(t => group.task_ids.includes(t.id));
                return (
                  <div
                    key={idx}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <FolderKanban className="w-4 h-4 text-purple-400" />
                          <h5 className="font-semibold text-white">{group.name}</h5>
                          <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                            {group.task_ids.length} tasks
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">{group.description}</p>
                        <p className="text-xs text-purple-400/70">
                          <span className="font-medium">Why:</span> {group.reason}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleCreateProject(group)}
                        className="bg-blue-600 hover:bg-blue-700 ml-4"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Create
                      </Button>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className={`px-2 py-1 rounded ${
                        group.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        group.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {group.priority} priority
                      </span>
                      <span>⏱️ {group.estimated_completion}</span>
                    </div>

                    {/* Tasks Preview */}
                    <div className="space-y-1">
                      {groupTasks.slice(0, 3).map(task => (
                        <div key={task.id} className="flex items-center space-x-2 text-xs">
                          <CheckCircle2 className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-400 line-clamp-1">{task.title}</span>
                        </div>
                      ))}
                      {groupTasks.length > 3 && (
                        <p className="text-xs text-slate-500 pl-5">+{groupTasks.length - 3} more tasks</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ungrouped Tasks */}
          {suggestions.ungrouped_tasks && suggestions.ungrouped_tasks.length > 0 && (
            <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-400">
                {suggestions.ungrouped_tasks.length} tasks don't fit into suggested groups
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}