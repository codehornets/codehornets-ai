import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agent_id } = await req.json();

    if (!agent_id) {
      return Response.json({ error: 'agent_id is required' }, { status: 400 });
    }

    // Fetch the agent
    const agents = await base44.asServiceRole.entities.Agent.filter({ id: agent_id });
    if (!agents.length) {
      return Response.json({ error: 'Agent not found' }, { status: 404 });
    }
    const agent = agents[0];

    // Fetch all feedback for this agent
    const allFeedback = await base44.asServiceRole.entities.AgentFeedback.filter({ agent_id });
    
    // Fetch client feedback related to this agent's outputs
    const clientFeedback = await base44.asServiceRole.entities.ClientFeedback.filter({ 
      feedback_type: 'agent_insight' 
    });

    // Fetch recent tasks for this agent
    const tasks = await base44.asServiceRole.entities.Task.filter({ agent_id }, '-created_date', 50);

    if (allFeedback.length === 0 && clientFeedback.length === 0 && tasks.length === 0) {
      return Response.json({ 
        message: 'Insufficient data for analysis',
        improvements: []
      });
    }

    // Analyze feedback using AI
    const prompt = `Analyze the following data for AI Agent "${agent.name}" (${agent.role} in ${agent.domain}):

AGENT CURRENT CONFIGURATION:
- Model: ${agent.model || 'gpt-4'}
- Temperature: ${agent.temperature || 0.7}
- Behavior: ${JSON.stringify(agent.behavior_settings || {})}
- Output Format: ${JSON.stringify(agent.output_format_preferences || {})}

PERFORMANCE METRICS:
- Success Rate: ${agent.success_rate || 0}%
- Tasks Completed: ${agent.tasks_completed || 0}
- Avg Completion Time: ${agent.avg_completion_time || 0}s

AGENT FEEDBACK (${allFeedback.length} reviews):
${allFeedback.slice(0, 20).map(f => `
- Rating: ${f.rating}/5
- Accuracy: ${f.aspects?.accuracy || 'N/A'}
- Completeness: ${f.aspects?.completeness || 'N/A'}
- Relevance: ${f.aspects?.relevance || 'N/A'}
- Comments: ${f.comments || 'None'}
- Improvements: ${f.suggested_improvements?.join(', ') || 'None'}
`).join('\n')}

CLIENT FEEDBACK (${clientFeedback.length} reviews):
${clientFeedback.slice(0, 10).map(f => `
- Rating: ${f.rating}/5
- Usefulness: ${f.usefulness_score || 'N/A'}
- Accuracy: ${f.accuracy_score || 'N/A'}
- Actionability: ${f.actionability_score || 'N/A'}
- What Worked: ${f.what_worked || 'N/A'}
- What Missed: ${f.what_missed || 'N/A'}
`).join('\n')}

RECENT TASK OUTCOMES:
${tasks.slice(0, 15).map(t => `
- Status: ${t.status}
- Duration: ${t.duration || 'N/A'}s
- Type: ${t.task_type}
- Error: ${t.error_message || 'None'}
`).join('\n')}

Based on this data, provide a JSON response with:
1. Overall performance assessment
2. Specific parameter adjustments (temperature, model, behavior settings)
3. Retraining recommendations (prompts or instructions to improve)
4. Priority areas for improvement

Return ONLY valid JSON matching this schema:
{
  "overall_assessment": "string (2-3 sentences)",
  "confidence_score": number (0-1),
  "parameter_adjustments": {
    "temperature": {
      "current": number,
      "recommended": number,
      "reason": "string"
    },
    "model": {
      "current": "string",
      "recommended": "string",
      "reason": "string"
    },
    "behavior_tweaks": [
      {
        "setting": "string",
        "current": "any",
        "recommended": "any",
        "reason": "string"
      }
    ],
    "output_format_tweaks": [
      {
        "setting": "string",
        "current": "any",
        "recommended": "any",
        "reason": "string"
      }
    ]
  },
  "retraining_recommendations": [
    {
      "area": "string",
      "prompt": "string (specific instruction for improvement)",
      "priority": "high|medium|low",
      "expected_impact": "string"
    }
  ],
  "priority_improvements": [
    {
      "issue": "string",
      "impact": "high|medium|low",
      "action": "string",
      "estimated_improvement": "string (e.g., +15% accuracy)"
    }
  ]
}`;

    const analysisResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          overall_assessment: { type: "string" },
          confidence_score: { type: "number" },
          parameter_adjustments: {
            type: "object",
            properties: {
              temperature: {
                type: "object",
                properties: {
                  current: { type: "number" },
                  recommended: { type: "number" },
                  reason: { type: "string" }
                }
              },
              model: {
                type: "object",
                properties: {
                  current: { type: "string" },
                  recommended: { type: "string" },
                  reason: { type: "string" }
                }
              },
              behavior_tweaks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    setting: { type: "string" },
                    current: {},
                    recommended: {},
                    reason: { type: "string" }
                  }
                }
              },
              output_format_tweaks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    setting: { type: "string" },
                    current: {},
                    recommended: {},
                    reason: { type: "string" }
                  }
                }
              }
            }
          },
          retraining_recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                area: { type: "string" },
                prompt: { type: "string" },
                priority: { type: "string" },
                expected_impact: { type: "string" }
              }
            }
          },
          priority_improvements: {
            type: "array",
            items: {
              type: "object",
              properties: {
                issue: { type: "string" },
                impact: { type: "string" },
                action: { type: "string" },
                estimated_improvement: { type: "string" }
              }
            }
          }
        }
      }
    });

    const analysis = analysisResult;

    // Update agent learning data
    const updatedLearningData = {
      ...(agent.learning_data || {}),
      last_analysis_date: new Date().toISOString(),
      total_feedback_analyzed: allFeedback.length + clientFeedback.length,
      confidence_score: analysis.confidence_score || 0
    };

    await base44.asServiceRole.entities.Agent.update(agent_id, {
      learning_data: updatedLearningData
    });

    return Response.json({
      success: true,
      agent_id,
      agent_name: agent.name,
      analysis,
      feedback_count: allFeedback.length,
      client_feedback_count: clientFeedback.length,
      tasks_analyzed: tasks.length,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return Response.json({ 
      error: 'Failed to analyze agent feedback', 
      details: error.message 
    }, { status: 500 });
  }
});