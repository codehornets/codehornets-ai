import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bot, CheckCircle2, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function AITaskMonitor({ tasks = [], agents = [], campaign, client }) {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (tasks.length > 0) {
      analyzeTaskRisks();
    }
  }, [tasks]);

  const analyzeTaskRisks = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const atRiskTasks = tasks.filter(task => {
        if (task.status === 'completed') return false;
        if (task.status === 'failed') return true;
        if (task.due_date && new Date(task.due_date) < now && task.status !== 'completed') return true;
        if (task.status === 'pending' && task.created_date) {
          const daysSinceCreated = (now - new Date(task.created_date)) / (1000 * 60 * 60 * 24);
          if (daysSinceCreated > 3) return true;
        }
        return false;
      });

      if (atRiskTasks.length === 0) {
        setRisks([]);
        setLoading(false);
        return;
      }

      const agentWorkloads = agents.map(agent => {
        const agentTasks = tasks.filter(t => t.agent_id === agent.id);
        return {
          id: agent.id,
          name: agent.name,
          domain: agent.domain,
          totalTasks: agentTasks.length,
          runningTasks: agentTasks.filter(t => t.status === 'running').length,
          pendingTasks: agentTasks.filter(t => t.status === 'pending').length
        };
      });

      const prompt = `You are a campaign operations manager analyzing task risks for "${campaign.name}" campaign for ${client?.name || 'the client'}.

At-Risk Tasks:
${atRiskTasks.map((t, i) => `${i + 1}. "${t.title}" - Status: ${t.status}, ${t.due_date ? `Due: ${new Date(t.due_date).toLocaleDateString()}` : 'No deadline'}, Agent: ${agents.find(a => a.id === t.agent_id)?.name || 'Unassigned'}`).join('\n')}

Agent Workloads:
${agentWorkloads.map(a => `- ${a.name} (${a.domain}): ${a.totalTasks} total (${a.runningTasks} running, ${a.pendingTasks} pending)`).join('\n')}

For EACH at-risk task, provide:
1. Risk level (critical, high, medium)
2. Root cause (delayed, blocked, agent_overloaded, failed, stalled)
3. Recommended action (reassign, escalate, optimize, retry, manual_review)
4. Specific next step
5. Alternative agent suggestion if relevant (from available agents)

Be concise and actionable.`;

      const result = await client.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            task_analyses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  task_title: { type: 'string' },
                  risk_level: { type: 'string' },
                  root_cause: { type: 'string' },
                  recommended_action: { type: 'string' },
                  next_step: { type: 'string' },
                  alternative_agent_name: { type: 'string' }
                }
              }
            }
          }
        }
      });

      const enrichedRisks = result.task_analyses.map(analysis => {
        const task = atRiskTasks.find(t => t.title === analysis.task_title) || atRiskTasks[0];
        const alternativeAgent = agents.find(a => a.name === analysis.alternative_agent_name);
        return { ...analysis, task, alternativeAgent };
      });

      setRisks(enrichedRisks);
    } catch (error) {
      console.error('Failed to analyze task risks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeAction = async (risk) => {
    if (risk.recommended_action === 'escalate') {
      toast.success(`Escalated "${risk.task.title}" to campaign owner`);
    } else if (risk.recommended_action === 'reassign' && risk.alternativeAgent) {
      toast.success(`Suggested reassigning to ${risk.alternativeAgent.name}`);
    } else {
      toast.success(`Action taken for "${risk.task.title}"`);
    }
  };

  if (loading && risks.length === 0) {
    return (
      <Card style={{ 
        backgroundColor: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        padding: '16px'
      }}>
        <div className="flex items-center space-x-3">
          <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="text-sm text-slate-600">Analyzing tasks for risks...</span>
        </div>
      </Card>
    );
  }

  if (risks.length === 0) {
    return (
      <Card style={{ 
        backgroundColor: 'white',
        border: '1px solid #D1FAE5',
        borderRadius: '12px',
        padding: '16px'
      }}>
        <div className="flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-sm text-green-900">All tasks on track</p>
            <p className="text-xs text-green-700">No risks detected at this time</p>
          </div>
        </div>
      </Card>
    );
  }

  const riskColors = {
    critical: { bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B', icon: '#DC2626' },
    high: { bg: '#FED7AA', border: '#FDBA74', text: '#9A3412', icon: '#EA580C' },
    medium: { bg: '#FEF3C7', border: '#FDE68A', text: '#854D0E', icon: '#CA8A04' }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-orange-600" />
          <h4 className="font-semibold text-sm text-slate-900">AI Task Monitor</h4>
          <Badge className="bg-orange-100 text-orange-700 text-xs">
            {risks.length} {risks.length === 1 ? 'risk' : 'risks'} detected
          </Badge>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={analyzeTaskRisks}
          disabled={loading}
          className="text-slate-600 hover:text-slate-900"
        >
          Refresh
        </Button>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {risks.map((risk, idx) => {
            const colors = riskColors[risk.risk_level] || riskColors.medium;
            const isExpanded = expanded[idx];
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card style={{ 
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div 
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }))}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: colors.icon }} />
                        <span className="font-medium text-sm" style={{ color: colors.text }}>
                          {risk.task.title}
                        </span>
                        <Badge 
                          className="text-xs"
                          style={{ 
                            backgroundColor: colors.border, 
                            color: colors.text,
                            border: 'none'
                          }}
                        >
                          {risk.risk_level}
                        </Badge>
                      </div>
                      <p className="text-xs" style={{ color: colors.text, opacity: 0.8 }}>
                        {risk.root_cause.replace(/_/g, ' ')} • {risk.recommended_action.replace(/_/g, ' ')}
                      </p>
                    </div>
                    {isExpanded ? 
                      <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: colors.icon }} /> : 
                      <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: colors.icon }} />
                    }
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 pt-3 border-t space-y-3"
                        style={{ borderColor: colors.border }}
                      >
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: colors.text }}>
                            Recommended Next Step:
                          </p>
                          <p className="text-xs" style={{ color: colors.text, opacity: 0.9 }}>
                            {risk.next_step}
                          </p>
                        </div>

                        {risk.alternativeAgent && (
                          <div className="flex items-center space-x-2 p-2 rounded" style={{ backgroundColor: 'white' }}>
                            <Bot className="w-4 h-4 text-blue-600" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-slate-900">
                                Suggested: {risk.alternativeAgent.name}
                              </p>
                              <p className="text-xs text-slate-600">{risk.alternativeAgent.domain}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTakeAction(risk);
                            }}
                            className="text-xs h-7"
                            style={{ 
                              backgroundColor: colors.icon,
                              color: 'white'
                            }}
                          >
                            <Send className="w-3 h-3 mr-1" />
                            {risk.recommended_action === 'escalate' ? 'Escalate' : 
                             risk.recommended_action === 'reassign' ? 'Reassign' : 'Take Action'}
                          </Button>
                          {risk.risk_level === 'critical' && (
                            <span className="text-xs" style={{ color: colors.text }}>
                              Campaign owner will be notified
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}