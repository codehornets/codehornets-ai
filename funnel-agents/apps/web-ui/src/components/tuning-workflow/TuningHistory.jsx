import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, RotateCcw, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function TuningHistory({ tuningHistory, agents, onRollback }) {
  const [expandedRecord, setExpandedRecord] = useState(null);

  const groupedHistory = tuningHistory.reduce((acc, record) => {
    if (!acc[record.agent_id]) {
      acc[record.agent_id] = [];
    }
    acc[record.agent_id].push(record);
    return acc;
  }, {});

  const calculateImpact = (record) => {
    if (!record.performance_before || !record.performance_after) return null;

    const successRateDiff = (record.performance_after.success_rate || 0) - (record.performance_before.success_rate || 0);
    const ratingDiff = (record.performance_after.avg_rating || 0) - (record.performance_before.avg_rating || 0);

    return { successRateDiff, ratingDiff };
  };

  if (tuningHistory.length === 0) {
    return (
      <Card className="p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        <History className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
        <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          No Tuning History Yet
        </h4>
        <p style={{ color: 'var(--text-secondary)' }}>
          Start tuning agents to see their configuration history here
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedHistory).map(([agentId, records]) => {
        const agent = agents.find(a => a.id === agentId);
        if (!agent) return null;

        return (
          <Card key={agentId} className="overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {agent.name}
              </h4>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {records.length} tuning {records.length === 1 ? 'attempt' : 'attempts'}
              </p>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {records.map((record) => {
                const isExpanded = expandedRecord === record.id;
                const impact = calculateImpact(record);

                return (
                  <div key={record.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={`text-xs ${
                            record.trigger_type === 'rollback' ? 'bg-orange-500/20 text-orange-400' :
                            record.status === 'applied' ? 'bg-green-500/20 text-green-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {record.trigger_type}
                          </Badge>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {formatDistanceToNow(new Date(record.created_date), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {record.applied_changes?.length || 0} parameter{record.applied_changes?.length !== 1 ? 's' : ''} modified
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {impact && (
                          <div className="text-right mr-2">
                            {impact.successRateDiff !== 0 && (
                              <div className="flex items-center space-x-1">
                                {impact.successRateDiff > 0 ? (
                                  <TrendingUp className="w-3 h-3 text-green-400" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 text-red-400" />
                                )}
                                <span className={`text-xs ${impact.successRateDiff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {impact.successRateDiff > 0 ? '+' : ''}{impact.successRateDiff.toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="space-y-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        {/* Changes */}
                        {record.applied_changes?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                              Changes Applied:
                            </p>
                            <div className="space-y-2">
                              {record.applied_changes.map((change, idx) => (
                                <div
                                  key={idx}
                                  className="p-2 rounded text-xs"
                                  style={{ backgroundColor: 'var(--bg-surface)' }}
                                >
                                  <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                                    {change.parameter}
                                  </p>
                                  <div className="flex items-center space-x-2">
                                    <code className="px-2 py-1 rounded bg-slate-800/50" style={{ color: 'var(--text-muted)' }}>
                                      {change.old_value}
                                    </code>
                                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                                    <code className="px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                                      {change.new_value}
                                    </code>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Performance Impact */}
                        {impact && (
                          <div>
                            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                              Performance Impact:
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-2 rounded" style={{ backgroundColor: 'var(--bg-surface)' }}>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Success Rate</p>
                                <p className={`text-sm font-medium ${
                                  impact.successRateDiff > 0 ? 'text-green-400' :
                                  impact.successRateDiff < 0 ? 'text-red-400' : 'text-slate-400'
                                }`}>
                                  {impact.successRateDiff > 0 ? '+' : ''}{impact.successRateDiff.toFixed(1)}%
                                </p>
                              </div>
                              <div className="p-2 rounded" style={{ backgroundColor: 'var(--bg-surface)' }}>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Rating</p>
                                <p className={`text-sm font-medium ${
                                  impact.ratingDiff > 0 ? 'text-green-400' :
                                  impact.ratingDiff < 0 ? 'text-red-400' : 'text-slate-400'
                                }`}>
                                  {impact.ratingDiff > 0 ? '+' : ''}{impact.ratingDiff.toFixed(1)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Rollback Button */}
                        {record.trigger_type !== 'rollback' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRollback(record)}
                            className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Rollback to This Configuration
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}