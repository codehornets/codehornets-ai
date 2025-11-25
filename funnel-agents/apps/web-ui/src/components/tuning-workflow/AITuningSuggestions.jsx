import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, CheckCircle2, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AITuningSuggestions({ suggestions, agents, onApplyTuning, isApplying }) {
  const [expandedAgent, setExpandedAgent] = useState(null);

  if (!suggestions || !suggestions.agent_tunings) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          AI-Generated Tuning Recommendations
        </h3>
      </div>

      {suggestions.agent_tunings.map((tuning, index) => {
        const agent = agents.find(a => a.id === tuning.agent_id);
        if (!agent) return null;

        const isExpanded = expandedAgent === tuning.agent_id;

        return (
          <motion.div
            key={tuning.agent_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                      {agent.name}
                    </h4>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      {agent.role} • {agent.domain}
                    </p>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-400">
                    {tuning.recommendations.length} changes
                  </Badge>
                </div>

                {/* Summary */}
                {tuning.analysis && (
                  <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {tuning.analysis.summary}
                    </p>
                  </div>
                )}

                {/* Issues Identified */}
                {tuning.analysis?.identified_issues?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                      Issues Identified:
                    </p>
                    <ul className="space-y-1">
                      {tuning.analysis.identified_issues.map((issue, idx) => (
                        <li key={idx} className="text-xs flex items-start space-x-2">
                          <span className="text-orange-400 mt-1">•</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                <div className="space-y-2 mb-4">
                  {tuning.recommendations.slice(0, isExpanded ? undefined : 3).map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border"
                      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Settings className="w-3 h-3 text-blue-400" />
                            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                              {rec.category}
                            </p>
                          </div>
                          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                            {rec.rationale}
                          </p>
                        </div>
                        <Badge className={`text-xs ${
                          rec.confidence === 'high' ? 'bg-green-500/20 text-green-400' :
                          rec.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {rec.confidence}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>Current:</span>
                        <code className="px-2 py-1 rounded bg-slate-800/50" style={{ color: 'var(--text-primary)' }}>
                          {rec.current_value}
                        </code>
                        <ArrowRight className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-muted)' }}>Suggested:</span>
                        <code className="px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                          {rec.recommended_value}
                        </code>
                      </div>
                      {rec.expected_impact && (
                        <p className="text-xs mt-2 flex items-start space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5" />
                          <span style={{ color: 'var(--text-secondary)' }}>
                            Expected: {rec.expected_impact}
                          </span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Show More / Less */}
                {tuning.recommendations.length > 3 && (
                  <button
                    onClick={() => setExpandedAgent(isExpanded ? null : tuning.agent_id)}
                    className="text-xs text-blue-400 hover:text-blue-300 mb-4"
                  >
                    {isExpanded ? 'Show Less' : `Show ${tuning.recommendations.length - 3} More`}
                  </button>
                )}

                {/* Apply Button */}
                <Button
                  onClick={() => {
                    const changes = tuning.recommendations.map(rec => ({
                      parameter: rec.category.toLowerCase().replace(/ /g, '_'),
                      new_value: rec.recommended_value,
                    }));
                    onApplyTuning(tuning.agent_id, changes, tuning);
                  }}
                  disabled={isApplying}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Apply Tuning to {agent.name}
                </Button>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}