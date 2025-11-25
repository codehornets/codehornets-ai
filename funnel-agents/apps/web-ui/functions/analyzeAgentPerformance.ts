import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agent_id, feedback_id, task_id } = await req.json();

    if (!agent_id) {
      return Response.json({ error: 'agent_id is required' }, { status: 400 });
    }

    // Fetch agent data
    const agents = await base44.asServiceRole.entities.Agent.list();
    const agent = agents.find(a => a.id === agent_id);

    if (!agent) {
      return Response.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Fetch recent feedback for this agent
    const allAgentFeedback = await base44.asServiceRole.entities.AgentFeedback.list('-created_date', 50);
    const agentFeedback = allAgentFeedback.filter(f => f.agent_id === agent_id);

    // Fetch tasks by this agent
    const allTasks = await base44.asServiceRole.entities.Task.list('-created_date', 100);
    const agentTasks = allTasks.filter(t => t.agent_id === agent_id);

    // Fetch client feedback related to this agent's work
    const allClientFeedback = await base44.asServiceRole.entities.ClientFeedback.list('-created_date', 50);
    const relatedClientFeedback = allClientFeedback.filter(f => 
      f.related_id && agentTasks.some(t => t.id === f.related_id)
    );

    // Calculate current performance metrics
    const recentFeedback = agentFeedback.slice(0, 20);
    const avgRating = recentFeedback.length > 0
      ? recentFeedback.reduce((sum, f) => sum + f.rating, 0) / recentFeedback.length
      : 0;

    const recentTasks = agentTasks.slice(0, 30);
    const successRate = recentTasks.length > 0
      ? (recentTasks.filter(t => t.status === 'completed').length / recentTasks.length) * 100
      : 0;

    const completedTasks = recentTasks.filter(t => t.status === 'completed' && t.duration);
    const avgCompletionTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => sum + t.duration, 0) / completedTasks.length
      : 0;

    // Analyze feedback patterns
    const negativeFeedback = agentFeedback.filter(f => f.rating < 3);
    const commonIssues = [];
    const improvementAreas = [];

    // Extract improvement suggestions from feedback
    agentFeedback.forEach(f => {
      if (f.suggested_improvements && Array.isArray(f.suggested_improvements)) {
        improvementAreas.push(...f.suggested_improvements);
      }
      if (f.comments && f.rating < 3) {
        commonIssues.push(f.comments);
      }
    });

    // Analyze aspect ratings
    const aspectScores = {
      accuracy: [],
      completeness: [],
      relevance: [],
      format: [],
      timeliness: []
    };

    agentFeedback.forEach(f => {
      if (f.aspects) {
        Object.keys(aspectScores).forEach(aspect => {
          if (f.aspects[aspect]) {
            aspectScores[aspect].push(f.aspects[aspect]);
          }
        });
      }
    });

    const avgAspectScores = {};
    Object.keys(aspectScores).forEach(aspect => {
      if (aspectScores[aspect].length > 0) {
        avgAspectScores[aspect] = 
          aspectScores[aspect].reduce((sum, score) => sum + score, 0) / aspectScores[aspect].length;
      }
    });

    // Use AI to generate tuning recommendations
    const prompt = `
You are an AI performance tuning expert. Analyze the following agent performance data and provide specific, actionable tuning recommendations.

AGENT PROFILE:
- Name: ${agent.name}
- Domain: ${agent.domain}
- Role: ${agent.role}
- Current Model: ${agent.model}
- Temperature: ${agent.temperature}
- Output Format: ${JSON.stringify(agent.output_format_preferences)}
- Behavior Settings: ${JSON.stringify(agent.behavior_settings)}

CURRENT PERFORMANCE:
- Average Rating: ${avgRating.toFixed(2)}/5
- Success Rate: ${successRate.toFixed(1)}%
- Avg Completion Time: ${(avgCompletionTime / 60).toFixed(1)} minutes
- Total Tasks: ${agentTasks.length}
- Recent Feedback Count: ${agentFeedback.length}

ASPECT SCORES:
${Object.entries(avgAspectScores).map(([aspect, score]) => `- ${aspect}: ${score.toFixed(2)}/5`).join('\n')}

COMMON ISSUES:
${commonIssues.slice(0, 5).map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

IMPROVEMENT SUGGESTIONS:
${[...new Set(improvementAreas)].slice(0, 5).map((suggestion, i) => `${i + 1}. ${suggestion}`).join('\n')}

TASK OUTCOMES:
- Completed: ${recentTasks.filter(t => t.status === 'completed').length}
- Failed: ${recentTasks.filter(t => t.status === 'failed').length}
- Pending: ${recentTasks.filter(t => t.status === 'pending').length}

Based on this data, provide:
1. A list of identified performance issues (3-5 key issues)
2. Root cause analysis for each issue
3. Specific tuning recommendations with category, current value, recommended value, rationale, and expected impact
4. Confidence level for each recommendation (low/medium/high)

Return a JSON object with this structure:
{
  "identified_issues": ["issue1", "issue2", ...],
  "root_causes": ["cause1", "cause2", ...],
  "improvement_areas": ["area1", "area2", ...],
  "recommendations": [
    {
      "category": "temperature|model|prompt|behavior|output_format|tools",
      "current_value": "current setting",
      "recommended_value": "new setting",
      "rationale": "why this change helps",
      "expected_impact": "what improvement to expect",
      "confidence": "low|medium|high"
    }
  ]
}
`;

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          identified_issues: { type: 'array', items: { type: 'string' } },
          root_causes: { type: 'array', items: { type: 'string' } },
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

    const analysis = llmResponse;

    // Create performance tuning record
    const tuningRecord = await base44.asServiceRole.entities.AgentPerformanceTuning.create({
      agent_id: agent.id,
      agent_name: agent.name,
      trigger_type: feedback_id ? 'feedback' : (task_id ? 'task_outcome' : 'performance_review'),
      trigger_id: feedback_id || task_id,
      analysis: {
        identified_issues: analysis.identified_issues || [],
        improvement_areas: analysis.improvement_areas || [],
        root_causes: analysis.root_causes || []
      },
      recommendations: analysis.recommendations || [],
      status: 'pending_review',
      performance_before: {
        avg_rating: avgRating,
        success_rate: successRate,
        avg_completion_time: avgCompletionTime
      }
    });

    return Response.json({
      success: true,
      tuning_id: tuningRecord.id,
      analysis: analysis,
      performance_metrics: {
        avg_rating: avgRating,
        success_rate: successRate,
        avg_completion_time: avgCompletionTime,
        aspect_scores: avgAspectScores
      },
      agent: {
        id: agent.id,
        name: agent.name,
        current_settings: {
          model: agent.model,
          temperature: agent.temperature,
          output_format: agent.output_format_preferences,
          behavior: agent.behavior_settings
        }
      }
    });

  } catch (error) {
    console.error('Error analyzing agent performance:', error);
    return Response.json({ 
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
});