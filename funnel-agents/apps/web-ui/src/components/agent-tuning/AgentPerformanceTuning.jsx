import { useState } from 'react';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Activity, TrendingUp, Zap, CheckCircle2, AlertTriangle,
  Settings, RefreshCw, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function AgentPerformanceTuning({ agentId }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedRec, setExpandedRec] = useState(null);
  const [selectedRecs, setSelectedRecs] = useState([]);
  const queryClient = useQueryClient();

  const { data: tuningRecords = [], isLoading } = useQuery({
    queryKey: ['agent-tuning', agentId],
    queryFn: async () => {
      const records = await client.entities.AgentPerformanceTuning.list('-created_date');
      return records.filter(r => r.agent_id === agentId);
    },
    enabled: !!agentId,
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await client.functions.invoke('analyzeAgentPerformance', {
        agent_id: agentId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-tuning', agentId] });
      toast.success('Performance analysis complete');
    },
  });

  const applyTuningMutation = useMutation({
    mutationFn: async ({ tuningId, recommendations }) => {
      const response = await client.functions.invoke('applyAgentTuning', {
        tuning_id: tuningId,
        apply_recommendations: recommendations,
        auto_apply: false
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-tuning', agentId] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setSelectedRecs([]);
      toast.success('Tuning applied successfully');
    },
  });

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await analyzeMutation.mutateAsync();
    } catch (error) {
      toast.error('Failed to analyze performance');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplySelected = async (tuning) => {
    if (selectedRecs.length === 0) {
      toast.error('Please select at least one recommendation');
      return;
    }

    await applyTuningMutation.mutateAsync({
      tuningId: tuning.id,
      recommendations: selectedRecs
    });
  };

  const confidenceColors = {
    low: 'bg-yellow-500/20 text-yellow-400',
    medium: 'bg-blue-500/20 text-blue-400',
    high: 'bg-green-500/20 text-green-400',
  };

  const statusColors = {
    pending_review: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-blue-500/20 text-blue-400',
    applied: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
    monitoring: 'bg-purple-500/20 text-purple-400',
  };

  const latestTuning = tuningRecords[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-purple-400" />
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Performance Tuning
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              AI-powered optimization based on feedback
            </p>
          </div>
        </div>
        <Button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {analyzing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Performance
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <Card className="p-6 animate-pulse" style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-subtle)' 
        }}>
          <div className="h-4 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-3 bg-slate-700 rounded w-2/3"></div>
        </Card>
      ) : tuningRecords.length === 0 ? (
        <Card className="p-8 text-center" style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-subtle)' 
        }}>
          <Settings className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            No performance analysis yet. Run an analysis to get AI-powered tuning recommendations.
          </p>
          <Button
            onClick={handleAnalyze}
            variant="outline"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            Run First Analysis
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Latest Tuning Recommendations */}
          {latestTuning && latestTuning.status === 'pending_review' && (
            <Card className="p-6" style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-subtle)' 
            }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      New Recommendations
                    </h4>
                    <Badge className={statusColors[latestTuning.status]}>
                      {latestTuning.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Generated {new Date(latestTuning.created_date).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Performance Metrics */}
              {latestTuning.performance_before && (
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Avg Rating</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {latestTuning.performance_before.avg_rating?.toFixed(2) || 0}/5
                    </p>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Success Rate</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {latestTuning.performance_before.success_rate?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Avg Time</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {((latestTuning.performance_before.avg_completion_time || 0) / 60).toFixed(1)}m
                    </p>
                  </div>
                </div>
              )}

              {/* Analysis Summary */}
              {latestTuning.analysis && (
                <div className="space-y-3 mb-6">
                  {latestTuning.analysis.identified_issues?.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        <h5 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          Identified Issues
                        </h5>
                      </div>
                      <ul className="space-y-1 ml-6">
                        {latestTuning.analysis.identified_issues.map((issue, idx) => (
                          <li key={idx} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            • {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations */}
              <div className="space-y-3">
                <h5 className="font-medium flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Tuning Recommendations</span>
                </h5>
                
                {latestTuning.recommendations?.map((rec, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="p-4" style={{ 
                      backgroundColor: 'var(--bg-surface)', 
                      border: '1px solid var(--border-subtle)' 
                    }}>
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={selectedRecs.includes(idx)}
                          onCheckedChange={(checked) => {
                            setSelectedRecs(prev => 
                              checked 
                                ? [...prev, idx]
                                : prev.filter(i => i !== idx)
                            );
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {rec.category}
                              </Badge>
                              <Badge className={`text-xs ${confidenceColors[rec.confidence]}`}>
                                {rec.confidence} confidence
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedRec(expandedRec === idx ? null : idx)}
                              className="h-auto p-1"
                            >
                              {expandedRec === idx ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                Current: 
                              </span>
                              <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>
                                {rec.current_value}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-green-400">
                                Recommended: 
                              </span>
                              <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>
                                {rec.recommended_value}
                              </span>
                            </div>
                          </div>

                          <AnimatePresence>
                            {expandedRec === idx && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 pt-3 space-y-2 text-sm"
                                style={{ borderTop: '1px solid var(--border-subtle)' }}
                              >
                                <div>
                                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                    Rationale:
                                  </span>
                                  <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                                    {rec.rationale}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                    Expected Impact:
                                  </span>
                                  <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                                    {rec.expected_impact}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Apply Button */}
              <div className="mt-6 flex items-center justify-between">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {selectedRecs.length} recommendation{selectedRecs.length !== 1 ? 's' : ''} selected
                </p>
                <Button
                  onClick={() => handleApplySelected(latestTuning)}
                  disabled={selectedRecs.length === 0 || applyTuningMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Apply Selected
                </Button>
              </div>
            </Card>
          )}

          {/* Tuning History */}
          <Card className="p-6" style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-subtle)' 
          }}>
            <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Tuning History
            </h4>
            <div className="space-y-3">
              {tuningRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-surface)' }}
                >
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={`text-xs ${statusColors[record.status]}`}>
                        {record.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(record.created_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {record.applied_changes?.length || 0} changes applied
                    </p>
                  </div>
                  {record.status === 'applied' && (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}