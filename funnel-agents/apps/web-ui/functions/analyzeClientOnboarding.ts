import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_data } = await req.json();

    if (!client_data) {
      return Response.json({ error: 'client_data required' }, { status: 400 });
    }

    const { name, industry, goals, description, challenges } = client_data;

    // Generate personalized onboarding recommendations
    const prompt = `You are an expert marketing strategist analyzing a new client for onboarding.

Client Information:
- Name: ${name}
- Industry: ${industry}
- Goals: ${goals?.join(', ')}
- Description: ${description || 'Not provided'}
- Challenges: ${challenges || 'Not specified'}

Provide a comprehensive onboarding analysis including:
1. RECOMMENDED_AGENTS: 5-7 specialized AI agents needed (with domain, role, and rationale)
2. CAMPAIGN_STRATEGIES: 3-4 campaign ideas with objectives and key channels
3. QUICK_WINS: 2-3 immediate actions they can take in first 30 days
4. POTENTIAL_CHALLENGES: 2-3 challenges to anticipate based on industry/goals
5. SUCCESS_METRICS: Key KPIs to track
6. ONBOARDING_TIMELINE: Suggested 90-day roadmap

Be specific, actionable, and tailored to their industry and goals.`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          recommended_agents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                domain: { type: "string" },
                role: { type: "string" },
                rationale: { type: "string" },
                priority: { type: "string", enum: ["high", "medium", "low"] }
              }
            }
          },
          campaign_strategies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                objective: { type: "string" },
                description: { type: "string" },
                key_channels: { type: "array", items: { type: "string" } },
                expected_outcome: { type: "string" },
                priority: { type: "string", enum: ["high", "medium", "low"] }
              }
            }
          },
          quick_wins: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string" },
                impact: { type: "string" },
                timeline: { type: "string" }
              }
            }
          },
          potential_challenges: {
            type: "array",
            items: {
              type: "object",
              properties: {
                challenge: { type: "string" },
                mitigation: { type: "string" }
              }
            }
          },
          success_metrics: {
            type: "array",
            items: { type: "string" }
          },
          onboarding_timeline: {
            type: "object",
            properties: {
              week_1_4: { type: "array", items: { type: "string" } },
              week_5_8: { type: "array", items: { type: "string" } },
              week_9_12: { type: "array", items: { type: "string" } }
            }
          },
          summary: { type: "string" }
        }
      }
    });

    return Response.json({
      analysis,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error analyzing onboarding:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});