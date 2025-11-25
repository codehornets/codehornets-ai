import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agent_ids, target_metrics } = await req.json();

    if (!agent_ids || !Array.isArray(agent_ids) || agent_ids.length === 0) {
      return Response.json({ error: 'agent_ids is required' }, { status: 400 });
    }

    // Fetch agents and their performance data
    const agents = await base44.asServiceRole.entities.Agent.list();
    const tasks = await base44.asServiceRole.entities.Task.list('-created_date', 500);
    const feedback = await base44.asServiceRole.entities.AgentFeedback.list('-created_date', 200);

    const selectedAgents = agents.filter(a => agent_ids.includes(a.id));
    const agentTunings = [];

    for (const agent of selectedAgents) {
      const agentTasks = tasks.filter(t => t.agent_id === agent.id);
      const agentFeedback = feedback.filter(f => f.agent_id === agent.id);

      const completedTasks = agentTasks.filter(t => t.status === 'completed').length;
      const failedTasks = agentTasks.filter(t => t.status === 'failed').length;
      const totalTasks = agentTasks.length;
      const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      const avgFeedback = agentFeedback.length > 0
        ? agentFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / agentFeedback.length
        : 0;

      const avgCompletionTime = agentTasks
        .filter(t => t.status === 'completed' && t.duration)
        .reduce((sum, t, i, arr) => sum + (t.duration || 0) / arr.length, 0);

      // Build context for LLM
      const context = `
Agent: ${agent.name}
Role: ${agent.role}
Domain: ${agent.domain}
Current Performance:
- Success Rate: ${successRate.toFixed(1)}%
- Avg Feedback: ${avgFeedback.toFixed(1)}/5
- Completed Tasks: ${completedTasks}
- Failed Tasks: ${failedTasks}
- Avg Completion Time: ${avgCompletionTime.toFixed(0)}s

Current Configuration:
- Model: ${agent.model || 'gpt-4'}
- Temperature: ${agent.temperature || 0.7}
- Output Format: ${agent.output_format_preferences?.format_type || 'conversational'}
- Behavior: ${JSON.stringify(agent.behavior_settings || {})}

Target Metrics to Improve: ${target_metrics.join(', ')}

Recent Task Failures:
${agentTasks.filter(t => t.status === 'failed').slice(0, 3).map(t => `- ${t.title}: ${t.error_message || 'No details'}`).join('\n')}

Recent Feedback:
${agentFeedback.slice(0, 5).map(f => `- Rating: ${f.rating}/5, Comment: ${f.comment || 'No comment'}`).join('\n')}
`;

      // Generate tuning recommendations using LLM
      const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are an AI agent performance optimization expert. Analyze the following agent performance data and provide specific tuning recommendations.

${context}

Provide recommendations in the following JSON structure:
{
  "summary": "Brief analysis of current issues",
  "identified_issues": ["issue1", "issue2"],
  "improvement_areas": ["area1", "area2"],
  "recommendations": [
    {
      "category": "parameter name (e.g., temperature, model, prompt_style)",
      "current_value": "current setting",
      "recommended_value": "suggested new value",
      "rationale": "why this change will help",
      "expected_impact": "expected improvement",
      "confidence": "high/medium/low"
    }
  ]
}

Focus on practical, actionable changes that directly address the target metrics: ${target_metrics.join(', ')}.
Consider model selection, temperature adjustments, output format changes, and behavioral settings.`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            identified_issues: { type: 'array', items: { type: 'string' } },
            improvement_areas: { type: 'array', items: { type: 'string' } },
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  current_value: { type: 'string' },
                  recommended_value: { type: 'string' },
                  rationale: { type: 'string' },
                  expected_impact: { type: 'string' },
                  confidence: { type: 'string' }
                }
              }
            }
          }
        }
      });

      agentTunings.push({
        agent_id: agent.id,
        agent_name: agent.name,
        analysis: llmResponse,
        recommendations: llmResponse.recommendations || [],
      });
    }

    return Response.json({
      agent_tunings: agentTunings,
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error generating agent tuning:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});