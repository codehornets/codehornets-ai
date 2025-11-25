import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, Loader2, TrendingUp, AlertTriangle, CheckCircle2, 
  XCircle, Trophy, Target, Zap 
} from 'lucide-react';
import client from '@/api/client';
import { toast } from 'sonner';

export default function AIProjectSummary({ project, tasks = [], agents = [] }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const generateSummary = async () => {
    if (!project || tasks.length === 0) return;

    setLoading(true);
    try {
      const tasksData = tasks.map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        agent_name: t.agent_name,
        created_date: t.created_date,
        completed_at: t.completed_at,
        depends_on: t.depends_on || [],
        blocks: t.blocks || [],
      }));

      const result = await client.integrations.Core.InvokeLLM({
        prompt: `Generate an executive summary for project "${project.name}":

Project Details:
- Description: ${project.description || 'N/A'}
- Status: ${project.status}
- Priority: ${project.priority}

Tasks (${tasks.length}):
${JSON.stringify(tasksData, null, 2)}

Analyze and provide:
1. Overall project health score (0-100)
2. Key achievements completed so far
3. Critical risks and blockers
4. Performance insights (velocity, quality)
5. Next critical actions needed
6. Areas performing well vs concerns

Return ONLY valid JSON:
{
  "health_score": 85,
  "health_status": "healthy|at_risk|critical",
  "summary": "2-3 sentence project overview",
  "achievements": [
    {
      "title": "Achievement name",
      "description": "What was accomplished",
      "impact": "high|medium|low"
    }
  ],
  "risks": [
    {
      "title": "Risk name",
      "description": "What's the problem",
      "severity": "critical|high|medium|low",
      "blocked_tasks": 3,
      "recommendation": "What to do about it"
    }
  ],
  "metrics": {
    "completion_rate": 65,
    "on_track_percentage": 80,
    "overdue_tasks": 2,
    "avg_completion_time_days": 3.5,
    "velocity_trend": "increasing|stable|decreasing"
  },
  "next_actions": [
    {
      "action": "What needs to be done",
      "priority": "urgent|high|medium",
      "estimated_impact": "Expected outcome"
    }
  ],
  "insights": {
    "strengths": ["What's going well"],
    "concerns": ["What needs attention"],
    "recommendations": "Strategic advice"
  }
}`,
        response_json_schema: {
          type: "object",
          properties: {
            health_score: { type: "number" },
            health_status: { type: "string" },
            summary: { type: "string" },
            achievements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  severity: { type: "string" },
                  blocked_tasks: { type: "number" },
                  recommendation: { type: "string" }
                }
              }
            },
            metrics: {
              type: "object",
              properties: {
                completion_rate: { type: "number" },
                on_track_percentage: { type: "number" },
                overdue_tasks: { type: "number" },
                avg_completion_time_days: { type: "number" },
                velocity_trend: { type: "string" }
              }
            },
            next_actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  priority: { type: "string" },
                  estimated_impact: { type: "string" }
                }
              }
            },
            insights: {
              type: "object",
              properties: {
                strengths: { type: "array", items: { type: "string" } },
                concerns: { type: "array", items: { type: "string" } },
                recommendations: { type: "string" }
              }
            }
          }
        }
      });

      setSummary(result);
      toast.success('AI summary generated!');
    } catch (error) {
      console.error('Summary generation error:', error);
      toast.error('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (status) => {
    if (status === 'healthy') return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (status === 'at_risk') return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  return (
    <Card className="glassmorphism-light border-green-500/30 bg-green-500/5 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold text-white">AI Progress Summary</h3>
          </div>
          <p className="text-sm text-green-400/80">
            Comprehensive analysis of project health, risks, and achievements
          </p>
        </div>
        <Button
          onClick={generateSummary}
          disabled={loading || tasks.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Summary
            </>
          )}
        </Button>
      </div>

      {summary && (
        <div className="space-y-6 mt-6">
          {/* Health Score */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`col-span-1 rounded-lg p-4 border ${getHealthColor(summary.health_status)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Project Health</span>
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-3xl font-bold mb-1">{summary.health_score}/100</div>
              <Badge className={`text-xs ${getHealthColor(summary.health_status)}`}>
                {summary.health_status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="col-span-2 bg-slate-800/50 rounded-lg p-4">
              <p className="text-sm text-slate-300 leading-relaxed">{summary.summary}</p>
            </div>
          </div>

          {/* Metrics */}
          {summary.metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Completion</p>
                <p className="text-xl font-bold text-white">{summary.metrics.completion_rate}%</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">On Track</p>
                <p className="text-xl font-bold text-white">{summary.metrics.on_track_percentage}%</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Avg Time</p>
                <p className="text-xl font-bold text-white">{summary.metrics.avg_completion_time_days}d</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Velocity</p>
                <div className="flex items-center space-x-1">
                  <Zap className={`w-4 h-4 ${
                    summary.metrics.velocity_trend === 'increasing' ? 'text-green-400' :
                    summary.metrics.velocity_trend === 'decreasing' ? 'text-red-400' : 'text-slate-400'
                  }`} />
                  <p className="text-sm font-semibold text-white capitalize">{summary.metrics.velocity_trend}</p>
                </div>
              </div>
            </div>
          )}

          {/* Risks */}
          {summary.risks && summary.risks.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Critical Risks & Blockers</span>
                <Badge className="bg-red-500/20 text-red-400 text-xs">{summary.risks.length}</Badge>
              </h4>
              {summary.risks.map((risk, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-4 border ${
                    risk.severity === 'critical' || risk.severity === 'high'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-amber-500/10 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <h5 className="font-semibold text-white">{risk.title}</h5>
                    </div>
                    <Badge className={`text-xs ${
                      risk.severity === 'critical' ? 'bg-red-500/30 text-red-300' :
                      risk.severity === 'high' ? 'bg-orange-500/30 text-orange-300' :
                      'bg-amber-500/30 text-amber-300'
                    }`}>
                      {risk.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">{risk.description}</p>
                  {risk.blocked_tasks > 0 && (
                    <p className="text-xs text-red-400 mb-2">⚠️ Blocking {risk.blocked_tasks} tasks</p>
                  )}
                  <div className="bg-slate-900/50 rounded p-2">
                    <p className="text-xs text-slate-400">
                      <span className="font-medium text-slate-300">Action:</span> {risk.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Achievements */}
          {summary.achievements && summary.achievements.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-green-400" />
                <span>Key Achievements</span>
              </h4>
              {summary.achievements.map((achievement, idx) => (
                <div key={idx} className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="font-semibold text-white">{achievement.title}</h5>
                        <Badge className={`text-xs ${
                          achievement.impact === 'high' ? 'bg-green-500/30 text-green-300' :
                          achievement.impact === 'medium' ? 'bg-blue-500/30 text-blue-300' :
                          'bg-slate-500/30 text-slate-300'
                        }`}>
                          {achievement.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm text-green-300/80">{achievement.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Next Actions */}
          {summary.next_actions && summary.next_actions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white flex items-center space-x-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span>Next Critical Actions</span>
              </h4>
              {summary.next_actions.map((action, idx) => (
                <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-white">{action.action}</p>
                    <Badge className={`text-xs ${
                      action.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                      action.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {action.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400">💡 {action.estimated_impact}</p>
                </div>
              ))}
            </div>
          )}

          {/* Insights */}
          {summary.insights && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.insights.strengths && summary.insights.strengths.length > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-green-300 mb-2">✅ Strengths</h5>
                  <ul className="space-y-1">
                    {summary.insights.strengths.map((strength, idx) => (
                      <li key={idx} className="text-xs text-green-400/80">• {strength}</li>
                    ))}
                  </ul>
                </div>
              )}
              {summary.insights.concerns && summary.insights.concerns.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-amber-300 mb-2">⚠️ Concerns</h5>
                  <ul className="space-y-1">
                    {summary.insights.concerns.map((concern, idx) => (
                      <li key={idx} className="text-xs text-amber-400/80">• {concern}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {summary.insights?.recommendations && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h5 className="text-sm font-medium text-blue-300 mb-2">💡 Strategic Recommendations</h5>
              <p className="text-sm text-blue-400/80">{summary.insights.recommendations}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}