import { useState } from 'react';
import client from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Loader2, Users, Mail, Target, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function AIWorkflowTemplates({ onSelectTemplate, campaigns = [], tasks = [] }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const campaignPerformance = campaigns.map(c => ({
        name: c.name,
        status: c.status,
        taskCount: tasks.filter(t => t.campaign_id === c.id).length,
        completedTasks: tasks.filter(t => t.campaign_id === c.id && t.status === 'completed').length,
      }));

      const prompt = `You are a marketing automation expert. Based on the following context, suggest 3 workflow templates that would be most valuable:

Context:
- Total campaigns: ${campaigns.length}
- Active campaigns: ${campaigns.filter(c => c.status === 'active').length}
- Total tasks executed: ${tasks.length}
- Success rate: ${tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%

Campaign Performance:
${campaignPerformance.slice(0, 5).map(c => `- ${c.name}: ${c.taskCount} tasks, ${c.completedTasks} completed`).join('\n')}

Suggest 3 workflow templates that would help this marketing agency. Each should include:
- name: Clear, actionable name
- objective: Primary marketing objective (lead_nurturing, campaign_execution, client_onboarding, content_pipeline, or reporting)
- description: 2-sentence explanation of what it automates
- steps: Array of 4-6 step objects with {type: 'agent'|'email'|'delay'|'condition', action: brief description}
- estimatedTimesSaved: e.g., "5 hours per week"
- useCase: When to use this workflow`;

      const response = await client.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            templates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  objective: { type: "string" },
                  description: { type: "string" },
                  steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string" },
                        action: { type: "string" }
                      }
                    }
                  },
                  estimatedTimeSaved: { type: "string" },
                  useCase: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSuggestions(response.templates);
    } catch (error) {
      toast.error('Failed to generate suggestions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const objectiveIcons = {
    lead_nurturing: Users,
    campaign_execution: Target,
    client_onboarding: Zap,
    content_pipeline: Mail,
    reporting: RefreshCw,
  };

  const objectiveColors = {
    lead_nurturing: 'from-blue-500 to-cyan-500',
    campaign_execution: 'from-purple-500 to-pink-500',
    client_onboarding: 'from-green-500 to-emerald-500',
    content_pipeline: 'from-orange-500 to-red-500',
    reporting: 'from-yellow-500 to-amber-500',
  };

  return (
    <Card className="p-6" style={{ 
      backgroundColor: 'var(--bg-card)', 
      border: '1px solid var(--border-subtle)' 
    }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            AI Workflow Suggestions
          </h3>
        </div>
        <Button
          onClick={generateSuggestions}
          disabled={loading}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              {suggestions ? 'Regenerate' : 'Get AI Suggestions'}
            </>
          )}
        </Button>
      </div>

      {loading && (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-purple-400" />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Analyzing your campaigns and generating personalized workflow suggestions...
          </p>
        </div>
      )}

      {!loading && !suggestions && (
        <div className="py-8 text-center">
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            AI will analyze your campaigns and suggest workflows tailored to your needs
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Examples: Lead nurturing sequences, campaign kickoff automations, weekly reporting
          </p>
        </div>
      )}

      {suggestions && !loading && Array.isArray(suggestions) && (
        <div className="space-y-3">
          {suggestions.map((template, index) => {
            const ObjectiveIcon = objectiveIcons[template.objective] || Target;
            const gradientColor = objectiveColors[template.objective] || objectiveColors.campaign_execution;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4 hover:shadow-md transition-all cursor-pointer group" style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradientColor} flex items-center justify-center flex-shrink-0`}>
                      <ObjectiveIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {template.name}
                        </h4>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {template.steps?.length || 0} steps
                        </Badge>
                      </div>
                      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                        {template.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {template.objective.replace('_', ' ')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-green-400" />
                          Saves {template.estimatedTimeSaved}
                        </div>
                      </div>

                      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                        <strong>Use case:</strong> {template.useCase}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.steps && Array.isArray(template.steps) && template.steps.map((step, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {i + 1}. {step.type}
                          </Badge>
                        ))}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => onSelectTemplate(template)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Use This Template
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}