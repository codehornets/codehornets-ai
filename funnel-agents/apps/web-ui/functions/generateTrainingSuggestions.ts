import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agent_id, skill_gaps, agent_role, agent_domain } = await req.json();

    if (!agent_id || !skill_gaps || !Array.isArray(skill_gaps)) {
      return Response.json({ error: 'agent_id and skill_gaps array are required' }, { status: 400 });
    }

    // Build context for LLM
    const context = `
Agent Role: ${agent_role}
Domain: ${agent_domain}

Identified Skill Gaps:
${skill_gaps.map(gap => `- ${gap.skill} (Current: ${gap.current_level || 'none'}, Required: ${gap.required_level})`).join('\n')}

Generate specific, actionable training recommendations to close these skill gaps.
`;

    // Generate training suggestions using LLM
    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an expert in professional development and training for AI agents and automation specialists. 

${context}

Provide comprehensive training recommendations in the following JSON structure:
{
  "training_plan": {
    "estimated_duration": "time to complete all training",
    "priority_order": ["skill1", "skill2", "skill3"]
  },
  "recommendations": [
    {
      "skill": "skill name",
      "priority": "critical/high/medium",
      "training_modules": [
        {
          "title": "specific course or resource name",
          "type": "online_course/tutorial/book/certification/workshop",
          "provider": "platform or source",
          "duration": "estimated time",
          "difficulty": "beginner/intermediate/advanced",
          "url": "example URL (use real examples when possible)",
          "description": "what this will teach",
          "cost": "free/paid"
        }
      ],
      "practical_exercises": [
        "specific hands-on exercise to practice this skill"
      ],
      "milestones": [
        "measurable achievement to validate skill acquisition"
      ]
    }
  ],
  "learning_path": "suggested order and approach for maximum efficiency"
}

Focus on:
1. Real, existing courses and resources (Coursera, Udemy, LinkedIn Learning, YouTube, documentation, etc.)
2. Practical, hands-on learning approaches
3. Measurable outcomes
4. Mix of free and paid resources
5. Domain-specific training relevant to ${agent_domain}`,
      response_json_schema: {
        type: 'object',
        properties: {
          training_plan: {
            type: 'object',
            properties: {
              estimated_duration: { type: 'string' },
              priority_order: { type: 'array', items: { type: 'string' } }
            }
          },
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                skill: { type: 'string' },
                priority: { type: 'string' },
                training_modules: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      type: { type: 'string' },
                      provider: { type: 'string' },
                      duration: { type: 'string' },
                      difficulty: { type: 'string' },
                      url: { type: 'string' },
                      description: { type: 'string' },
                      cost: { type: 'string' }
                    }
                  }
                },
                practical_exercises: { type: 'array', items: { type: 'string' } },
                milestones: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          learning_path: { type: 'string' }
        }
      }
    });

    return Response.json({
      agent_id,
      training_suggestions: llmResponse,
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error generating training suggestions:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});