import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Calendar, Target, AlertTriangle, TrendingUp } from 'lucide-react';
import client from '@/api/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AITimelineSuggestions({ project, tasks = [], agents = [] }) {
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState(null);

  const generateTimeline = async () => {
    if (!project || tasks.length === 0) return;

    setLoading(true);
    try {
      // Prepare task data with dependencies and agent info
      const tasksData = tasks.map(t => ({
        id: t.id,
        title: t.title,
        agent_id: t.agent_id,
        agent_name: t.agent_name,
        status: t.status,
        depends_on: t.depends_on || [],
        priority: t.priority,
        task_type: t.task_type,
        estimated_duration: t.duration || null,
      }));

      const agentsData = agents
        .filter(a => tasks.some(t => t.agent_id === a.id))
        .map(a => ({
          id: a.id,
          name: a.name,
          tasks_completed: a.tasks_completed || 0,
          avg_completion_time: a.avg_completion_time || 3600,
          current_workload: tasks.filter(t => t.agent_id === a.id && t.status === 'running').length,
        }));

      const result = await client.integrations.Core.InvokeLLM({
        prompt: `Create a realistic project timeline for "${project.name}":

Project Info:
- Description: ${project.description || 'N/A'}
- Priority: ${project.priority}
- Current Status: ${project.status}

Tasks (${tasks.length}):
${JSON.stringify(tasksData, null, 2)}

Agent Workloads:
${JSON.stringify(agentsData, null, 2)}

Analyze:
1. Task dependencies and optimal sequencing
2. Agent capacity and workload distribution
3. Realistic time estimates based on task complexity
4. Critical path and potential bottlenecks
5. Key milestones for project tracking

Return ONLY valid JSON:
{
  "estimated_duration_weeks": 4,
  "start_date": "2025-01-01",
  "end_date": "2025-02-01",
  "phases": [
    {
      "name": "Phase Name",
      "start_week": 1,
      "duration_weeks": 2,
      "description": "What happens in this phase",
      "task_ids": ["task_id1"],
      "critical": true
    }
  ],
  "milestones": [
    {
      "name": "Milestone Name",
      "week": 2,
      "description": "Deliverable or checkpoint",
      "success_criteria": "How to measure completion"
    }
  ],
  "risks": [
    {
      "description": "Potential delay or bottleneck",
      "severity": "high|medium|low",
      "mitigation": "How to address it"
    }
  ],
  "agent_allocation": {
    "agent_id": {
      "tasks_count": 5,
      "estimated_hours": 40,
      "concerns": "Overloaded or needs help"
    }
  },
  "recommendations": "Strategic advice for timeline success"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            estimated_duration_weeks: { type: "number" },
            start_date: { type: "string" },
            end_date: { type: "string" },
            phases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  start_week: { type: "number" },
                  duration_weeks: { type: "number" },
                  description: { type: "string" },
                  task_ids: { type: "array", items: { type: "string" } },
                  critical: { type: "boolean" }
                }
              }
            },
            milestones: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  week: { type: "number" },
                  description: { type: "string" },
                  success_criteria: { type: "string" }
                }
              }
            },
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  severity: { type: "string" },
                  mitigation: { type: "string" }
                }
              }
            },
            agent_allocation: { type: "object" },
            recommendations: { type: "string" }
          }
        }
      });

      setTimeline(result);
      toast.success('Timeline generated!');
    } catch (error) {
      console.error('Timeline generation error:', error);
      toast.error('Failed to generate timeline');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glassmorphism-light border-blue-500/30 bg-blue-500/5 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">AI Timeline & Milestones</h3>
          </div>
          <p className="text-sm text-blue-400/80">
            Smart scheduling based on task dependencies and agent workloads
          </p>
        </div>
        <Button
          onClick={generateTimeline}
          disabled={loading || tasks.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Timeline
            </>
          )}
        </Button>
      </div>

      {timeline && (
        <div className="space-y-6 mt-6">
          {/* Duration Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Estimated Duration</p>
              <p className="text-2xl font-bold text-white">{timeline.estimated_duration_weeks}w</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Start Date</p>
              <p className="text-sm font-semibold text-white">
                {timeline.start_date ? format(new Date(timeline.start_date), 'MMM d, yyyy') : '—'}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Target End</p>
              <p className="text-sm font-semibold text-white">
                {timeline.end_date ? format(new Date(timeline.end_date), 'MMM d, yyyy') : '—'}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          {timeline.recommendations && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-300 mb-1">Strategic Recommendations</p>
                  <p className="text-sm text-blue-400/80">{timeline.recommendations}</p>
                </div>
              </div>
            </div>
          )}

          {/* Phases */}
          {timeline.phases && timeline.phases.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white flex items-center space-x-2">
                <span>Project Phases</span>
                <Badge className="bg-slate-700 text-slate-300 text-xs">{timeline.phases.length}</Badge>
              </h4>
              {timeline.phases.map((phase, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-4 border ${
                    phase.critical 
                      ? 'bg-orange-500/10 border-orange-500/30' 
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-white">Week {phase.start_week}</span>
                      <h5 className="font-semibold text-white">{phase.name}</h5>
                      {phase.critical && (
                        <Badge className="bg-orange-500/20 text-orange-400 text-xs">Critical</Badge>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{phase.duration_weeks}w duration</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">{phase.description}</p>
                  <p className="text-xs text-slate-500">{phase.task_ids.length} tasks in this phase</p>
                </div>
              ))}
            </div>
          )}

          {/* Milestones */}
          {timeline.milestones && timeline.milestones.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Key Milestones</span>
              </h4>
              {timeline.milestones.map((milestone, idx) => (
                <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs font-medium text-blue-400">Week {milestone.week}</span>
                      <h5 className="font-semibold text-white mt-1">{milestone.name}</h5>
                    </div>
                    <Target className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-sm text-slate-400 mb-2">{milestone.description}</p>
                  <div className="bg-slate-900/50 rounded p-2">
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-slate-400">Success:</span> {milestone.success_criteria}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Risks */}
          {timeline.risks && timeline.risks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Potential Risks</span>
              </h4>
              {timeline.risks.map((risk, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-3 border ${
                    risk.severity === 'high' 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : risk.severity === 'medium'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-blue-500/10 border-blue-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm text-white">{risk.description}</p>
                    <Badge className={`text-xs ${
                      risk.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                      risk.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {risk.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    <span className="font-medium">Mitigation:</span> {risk.mitigation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}