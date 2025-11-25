import { useState } from 'react';
import client from '@/api/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertTriangle, CheckCircle2, Clock, Zap, Loader2, Lightbulb, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WorkflowPerformanceMonitor({ workflow, workflowRuns = [] }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState(null);

  // Calculate performance metrics
  const totalRuns = workflowRuns.length;
  const successfulRuns = workflowRuns.filter(r => r.status === 'completed').length;
  const failedRuns = workflowRuns.filter(r => r.status === 'failed').length;
  const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;
  
  const avgDuration = workflowRuns
    .filter(r => r.duration)
    .reduce((sum, r) => sum + r.duration, 0) / (workflowRuns.filter(r => r.duration).length || 1);

  // Identify bottleneck nodes
  const nodePerformance = {};
  workflowRuns.forEach(run => {
    if (run.node_results) {
      run.node_results.forEach(nodeResult => {
        if (!nodePerformance[nodeResult.node_id]) {
          nodePerformance[nodeResult.node_id] = {
            name: nodeResult.node_name,
            executions: 0,
            failures: 0,
            totalTime: 0,
          };
        }
        nodePerformance[nodeResult.node_id].executions++;
        if (nodeResult.status === 'failed') {
          nodePerformance[nodeResult.node_id].failures++;
        }
      });
    }
  });

  const analyzePerformance = async () => {
    if (totalRuns === 0) {
      return;
    }

    setAnalyzing(true);
    try {
      const bottlenecks = Object.entries(nodePerformance)
        .filter(([_, perf]) => perf.failures > 0)
        .map(([nodeId, perf]) => ({
          nodeId,
          name: perf.name,
          failureRate: Math.round((perf.failures / perf.executions) * 100),
        }));

      const prompt = `You are a workflow optimization expert. Analyze this workflow performance and provide actionable insights:

Workflow: ${workflow.name}
Description: ${workflow.description || 'No description'}
Total Runs: ${totalRuns}
Success Rate: ${successRate}%
Average Duration: ${Math.round(avgDuration)}s
Failed Runs: ${failedRuns}

Nodes with Issues:
${bottlenecks.length > 0 ? bottlenecks.map(b => `- ${b.name}: ${b.failureRate}% failure rate`).join('\n') : 'No failures detected'}

Provide 3-5 optimization suggestions to improve this workflow. Each suggestion should include:
- title: Short, actionable title
- impact: high | medium | low
- description: What to do and why
- expectedImprovement: What will improve (e.g., "Reduce execution time by 30%")`;

      const response = await client.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            overallHealth: { type: "string" },
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  impact: { type: "string" },
                  description: { type: "string" },
                  expectedImprovement: { type: "string" }
                }
              }
            }
          }
        }
      });

      setInsights(response);
    } catch (error) {
      toast.error('Failed to analyze workflow');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const impactColors = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  return (
    <div className="space-y-4">
      {/* Performance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total Runs</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{totalRuns}</p>
            </div>
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
        </Card>

        <Card className="p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Success Rate</p>
              <p className="text-2xl font-bold mt-1" style={{ color: successRate >= 90 ? '#10B981' : successRate >= 70 ? '#F59E0B' : '#EF4444' }}>
                {successRate}%
              </p>
            </div>
            {successRate >= 90 ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : successRate >= 70 ? (
              <TrendingUp className="w-5 h-5 text-yellow-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            )}
          </div>
        </Card>

        <Card className="p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Avg Duration</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                {Math.round(avgDuration)}s
              </p>
            </div>
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
        </Card>

        <Card className="p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Failed</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{failedRuns}</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
        </Card>
      </div>

      {/* AI Optimization Insights */}
      {totalRuns > 0 && (
        <Card className="p-6" style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-subtle)' 
        }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                AI Optimization Insights
              </h4>
            </div>
            {!insights && (
              <Button
                onClick={analyzePerformance}
                disabled={analyzing}
                variant="outline"
                className="border-slate-700 text-white hover:bg-slate-800"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Performance'
                )}
              </Button>
            )}
          </div>

          {insights && (
            <div className="space-y-3">
              {insights.overallHealth && (
                <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {insights.overallHealth}
                  </p>
                </div>
              )}

              {insights.suggestions && Array.isArray(insights.suggestions) && insights.suggestions.map((suggestion, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 rounded-lg" 
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <div className="flex items-start gap-3">
                    <Badge className={`${impactColors[suggestion.impact]} border text-xs`}>
                      {suggestion.impact} impact
                    </Badge>
                    <div className="flex-1">
                      <h5 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        {suggestion.title}
                      </h5>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {suggestion.description}
                      </p>
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <TrendingUp className="w-3 h-3 text-green-400" />
                        {suggestion.expectedImprovement}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              <Button
                onClick={analyzePerformance}
                variant="ghost"
                className="w-full text-slate-400 hover:text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Analysis
              </Button>
            </div>
          )}

          {!insights && !analyzing && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
              Click "Analyze Performance" to get AI-powered optimization suggestions
            </p>
          )}
        </Card>
      )}
    </div>
  );
}