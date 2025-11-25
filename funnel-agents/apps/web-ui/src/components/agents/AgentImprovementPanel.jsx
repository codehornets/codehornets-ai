import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import client from '@/api/client';
import { 
  TrendingUp, AlertCircle, Lightbulb, 
  RefreshCw, Settings, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function AgentImprovementPanel({ agent, onUpdate }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    params: true,
    retraining: false,
    priorities: true
  });

  const analyzePerformance = async () => {
    setLoading(true);
    try {
      const response = await client.functions.invoke('analyzeAgentFeedback', {
        agent_id: agent.id
      });
      
      if (response.data.improvements?.length === 0) {
        toast.info('Insufficient feedback data for analysis');
      } else {
        setAnalysis(response.data);
        toast.success('Performance analysis complete');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Failed to analyze performance');
    } finally {
      setLoading(false);
    }
  };

  const applyImprovements = async (autoApply = false) => {
    if (!analysis?.analysis) return;
    
    setApplying(true);
    try {
      const response = await client.functions.invoke('applyAgentImprovements', {
        agent_id: agent.id,
        improvements: analysis.analysis,
        auto_apply: autoApply
      });

      toast.success(`Applied ${response.data.applied_changes.length} improvements`);
      if (onUpdate) onUpdate();
      
      // Refresh analysis after applying
      setTimeout(() => analyzePerformance(), 1000);
    } catch (error) {
      console.error('Failed to apply improvements:', error);
      toast.error('Failed to apply improvements');
    } finally {
      setApplying(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const impactColors = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  };

  const priorityColors = {
    high: 'bg-orange-500/20 text-orange-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-blue-500/20 text-blue-400'
  };

  if (!analysis) {
    return (
      <Card className="p-6" style={{ 
        backgroundColor: 'var(--bg-card)', 
        border: '1px solid var(--border-subtle)' 
      }}>
        <div className="text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-blue-400" />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            AI-Powered Performance Tuning
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Analyze feedback and task outcomes to automatically optimize agent parameters
          </p>
          <Button 
            onClick={analyzePerformance}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Analyze Performance
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  const { analysis: analysisData } = analysis;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4" style={{ 
        backgroundColor: 'var(--bg-card)', 
        border: '1px solid var(--border-subtle)' 
      }}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Performance Analysis
            </h3>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              {analysisData.overall_assessment}
            </p>
            <div className="flex items-center space-x-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>Analyzed {analysis.feedback_count} agent reviews</span>
              <span>•</span>
              <span>{analysis.client_feedback_count} client reviews</span>
              <span>•</span>
              <span>{analysis.tasks_analyzed} tasks</span>
              <span>•</span>
              <Badge variant="outline" className="text-xs">
                {Math.round(analysisData.confidence_score * 100)}% confidence
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={analyzePerformance}
              disabled={loading}
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              <RefreshCw className={`w-3 h-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => applyImprovements(true)}
              disabled={applying}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {applying ? 'Applying...' : 'Apply All'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Parameter Adjustments */}
      {analysisData.parameter_adjustments && (
        <Collapsible open={expandedSections.params}>
          <Card style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-subtle)' 
          }}>
            <CollapsibleTrigger asChild>
              <button
                onClick={() => toggleSection('params')}
                className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-surface)] transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-blue-400" />
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    Parameter Adjustments
                  </h4>
                </div>
                {expandedSections.params ? 
                  <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : 
                  <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                }
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-3">
                {/* Temperature */}
                {analysisData.parameter_adjustments.temperature && (
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        Temperature
                      </span>
                      <div className="flex items-center space-x-2 text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>
                          {analysisData.parameter_adjustments.temperature.current} → {analysisData.parameter_adjustments.temperature.recommended}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {analysisData.parameter_adjustments.temperature.reason}
                    </p>
                  </div>
                )}

                {/* Model */}
                {analysisData.parameter_adjustments.model?.recommended !== analysisData.parameter_adjustments.model?.current && (
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        AI Model
                      </span>
                      <div className="flex items-center space-x-2 text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>
                          {analysisData.parameter_adjustments.model.current} → {analysisData.parameter_adjustments.model.recommended}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {analysisData.parameter_adjustments.model.reason}
                    </p>
                  </div>
                )}

                {/* Behavior Tweaks */}
                {analysisData.parameter_adjustments.behavior_tweaks?.map((tweak, idx) => (
                  <div key={idx} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {tweak.setting.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center space-x-2 text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>
                          {String(tweak.current)} → {String(tweak.recommended)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {tweak.reason}
                    </p>
                  </div>
                ))}

                {/* Output Format Tweaks */}
                {analysisData.parameter_adjustments.output_format_tweaks?.map((tweak, idx) => (
                  <div key={idx} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {tweak.setting.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center space-x-2 text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>
                          {String(tweak.current)} → {String(tweak.recommended)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {tweak.reason}
                    </p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Priority Improvements */}
      {analysisData.priority_improvements?.length > 0 && (
        <Collapsible open={expandedSections.priorities}>
          <Card style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-subtle)' 
          }}>
            <CollapsibleTrigger asChild>
              <button
                onClick={() => toggleSection('priorities')}
                className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-surface)] transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    Priority Improvements ({analysisData.priority_improvements.length})
                  </h4>
                </div>
                {expandedSections.priorities ? 
                  <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : 
                  <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                }
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-2">
                {analysisData.priority_improvements.map((improvement, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-3 rounded-lg" 
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {improvement.issue}
                      </h5>
                      <Badge className={`text-xs ml-2 ${impactColors[improvement.impact]}`}>
                        {improvement.impact} impact
                      </Badge>
                    </div>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                      {improvement.action}
                    </p>
                    <div className="flex items-center space-x-1 text-xs text-green-400">
                      <TrendingUp className="w-3 h-3" />
                      <span>{improvement.estimated_improvement}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Retraining Recommendations */}
      {analysisData.retraining_recommendations?.length > 0 && (
        <Collapsible open={expandedSections.retraining}>
          <Card style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-subtle)' 
          }}>
            <CollapsibleTrigger asChild>
              <button
                onClick={() => toggleSection('retraining')}
                className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-surface)] transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    Retraining Recommendations ({analysisData.retraining_recommendations.length})
                  </h4>
                </div>
                {expandedSections.retraining ? 
                  <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : 
                  <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                }
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-2">
                {analysisData.retraining_recommendations.map((rec, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-3 rounded-lg" 
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {rec.area}
                      </h5>
                      <Badge className={`text-xs ml-2 ${priorityColors[rec.priority]}`}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <div className="mb-2 p-2 rounded text-xs font-mono" style={{ 
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-secondary)'
                    }}>
                      {rec.prompt}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Expected: {rec.expected_impact}
                    </p>
                  </motion.div>
                ))}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}