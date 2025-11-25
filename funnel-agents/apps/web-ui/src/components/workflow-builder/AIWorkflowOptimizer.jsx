import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, TrendingUp, AlertTriangle, CheckCircle2, 
  Lightbulb, Zap, RefreshCw, ChevronDown, ChevronUp 
} from 'lucide-react';
import client from '@/api/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIWorkflowOptimizer({ workflowId, workflowName, onAnalysisComplete }) {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedOptimization, setExpandedOptimization] = useState(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await client.functions.invoke('analyzeWorkflowPerformance', {
        workflow_id: workflowId,
      });
      setAnalysis(response.data);
      if (onAnalysisComplete) {
        onAnalysisComplete(response.data);
      }
      toast.success('Workflow analysis complete');
    } catch (error) {
      toast.error('Failed to analyze workflow');
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const priorityColors = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  const severityColors = {
    high: 'text-red-400',
    medium: 'text-orange-400',
    low: 'text-yellow-400',
  };

  const typeIcons = {
    node_optimization: Zap,
    edge_optimization: TrendingUp,
    trigger_optimization: AlertTriangle,
    structure: Lightbulb,
  };

  if (!analysis) {
    return (
      <Card className="p-6 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-400" />
        <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          AI Workflow Optimization
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Analyze execution data to identify bottlenecks and get AI-powered optimization suggestions
        </p>
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Workflow
            </>
          )}
        </Button>
      </Card>
    );
  }

  const { analysis: aiAnalysis, metrics } = analysis;

  return (
    <div className="space-y-4">
      {/* Performance Score */}
      <Card className="p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Performance Analysis
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            style={{ color: 'var(--text-secondary)' }}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Performance Score</p>
            <p className="text-2xl font-bold text-purple-400">
              {aiAnalysis.performance_score || 0}/100
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Success Rate</p>
            <p className="text-2xl font-bold text-green-400">
              {metrics.successRate.toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Duration</p>
            <p className="text-2xl font-bold text-blue-400">
              {(metrics.avgDuration / 1000).toFixed(1)}s
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Executions</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {metrics.totalExecutions}
            </p>
          </div>
        </div>

        {aiAnalysis.overall_assessment && (
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {aiAnalysis.overall_assessment}
            </p>
          </div>
        )}
      </Card>

      {/* Bottlenecks */}
      {aiAnalysis.bottlenecks?.length > 0 && (
        <Card className="p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Identified Bottlenecks
            </h3>
          </div>
          <div className="space-y-2">
            {aiAnalysis.bottlenecks.map((bottleneck, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {bottleneck.node_id}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {bottleneck.issue}
                    </p>
                  </div>
                  <Badge className={`text-xs ${
                    severityColors[bottleneck.severity]
                  } bg-transparent border`}>
                    {bottleneck.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Wins */}
      {aiAnalysis.quick_wins?.length > 0 && (
        <Card className="p-6 bg-green-500/5 border-green-500/20">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Quick Wins
            </h3>
          </div>
          <ul className="space-y-2">
            {aiAnalysis.quick_wins.map((win, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {win}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Optimization Recommendations */}
      {aiAnalysis.optimizations?.length > 0 && (
        <Card className="p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Optimization Recommendations
            </h3>
          </div>
          <div className="space-y-3">
            {aiAnalysis.optimizations.map((opt, idx) => {
              const Icon = typeIcons[opt.type] || Lightbulb;
              const isExpanded = expandedOptimization === idx;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card 
                    className="p-4 cursor-pointer hover:shadow-md transition-all"
                    style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                    onClick={() => setExpandedOptimization(isExpanded ? null : idx)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-1">
                        <Icon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                          {opt.title}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs ${priorityColors[opt.priority]}`}>
                          {opt.priority}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        ) : (
                          <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-3 mt-3 pt-3"
                          style={{ borderTop: '1px solid var(--border-subtle)' }}
                        >
                          <div>
                            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                              Description:
                            </p>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {opt.description}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                              Expected Impact:
                            </p>
                            <p className="text-sm text-green-400">
                              {opt.expected_impact}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                              How to Implement:
                            </p>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {opt.implementation}
                            </p>
                          </div>

                          {opt.target && opt.target !== 'general' && (
                            <div className="flex items-center space-x-2 text-xs">
                              <span style={{ color: 'var(--text-muted)' }}>Target:</span>
                              <code className="px-2 py-1 rounded bg-slate-800/50" style={{ color: 'var(--text-primary)' }}>
                                {opt.target}
                              </code>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}