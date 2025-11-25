import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_id, type = 'auto' } = await req.json();

    if (!client_id) {
      return Response.json({ error: 'client_id required' }, { status: 400 });
    }

    // Get client data
    const workspaces = await base44.asServiceRole.entities.Workspace.list();
    const client = workspaces.find(w => w.id === client_id);

    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get agents, campaigns, tasks
    const agents = await base44.asServiceRole.entities.Agent.list();
    const campaigns = await base44.asServiceRole.entities.Campaign.list();
    const tasks = await base44.asServiceRole.entities.Task.list('-created_date', 50);

    const clientCampaigns = campaigns.filter(c => c.client_id === client_id);
    const clientTasks = tasks.filter(t => t.client_id === client_id);

    // Analyze and identify potential collaborations
    const prompt = `You are an AI agent orchestrator analyzing a client account to identify opportunities for agent collaboration.

Client: ${client.name}
Industry: ${client.industry || 'Unknown'}
Active Campaigns: ${clientCampaigns.length}
Recent Tasks: ${clientTasks.length}

Recent Task Performance:
${clientTasks.slice(0, 10).map(t => `- ${t.title} (${t.status})`).join('\n')}

Available Agents:
${agents.slice(0, 15).map(a => `- ${a.name} (${a.domain} - ${a.role})`).join('\n')}

Identify 2-3 high-value cross-agent collaboration opportunities where agents should work together or share insights. These could be:
- Issue alerts (performance problems, blocked tasks, resource issues)
- Opportunities identified (untapped channels, optimization potential, growth areas)
- Strategy suggestions (coordinated campaigns, process improvements)
- Cross-functional initiatives (multiple domains working together)

For each collaboration, specify which agents should be involved and why.`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          collaborations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                initiating_agent_name: { type: "string" },
                collaborating_agents: { 
                  type: "array",
                  items: { type: "string" }
                },
                collaboration_type: {
                  type: "string",
                  enum: ["insight_share", "strategy_suggestion", "issue_alert", "opportunity_identified", "cross_functional"]
                },
                priority: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"]
                },
                title: { type: "string" },
                message: { type: "string" },
                findings: {
                  type: "object",
                  properties: {
                    issue: { type: "string" },
                    impact: { type: "string" },
                    recommended_action: { type: "string" },
                    data_points: {
                      type: "array",
                      items: { type: "string" }
                    }
                  }
                }
              },
              required: ["initiating_agent_name", "collaboration_type", "priority", "title", "message"]
            }
          }
        }
      }
    });

    // Create collaboration records
    const createdCollaborations = [];

    for (const collab of analysis.collaborations) {
      // Find agents by name
      const initiatingAgent = agents.find(a => 
        a.name.toLowerCase().includes(collab.initiating_agent_name.toLowerCase())
      );

      if (!initiatingAgent) continue;

      const collaboratingAgentIds = collab.collaborating_agents
        ?.map(name => agents.find(a => a.name.toLowerCase().includes(name.toLowerCase()))?.id)
        .filter(id => id) || [];

      try {
        const collaboration = await base44.asServiceRole.entities.AgentCollaboration.create({
          client_id,
          initiating_agent_id: initiatingAgent.id,
          initiating_agent_name: initiatingAgent.name,
          collaborating_agent_ids: collaboratingAgentIds,
          collaboration_type: collab.collaboration_type,
          priority: collab.priority,
          title: collab.title,
          message: collab.message,
          findings: collab.findings || {},
          status: 'pending',
          user_notified: collab.priority === 'critical' || collab.priority === 'high',
        });

        createdCollaborations.push(collaboration);
      } catch (error) {
        console.error('Failed to create collaboration:', error);
      }
    }

    return Response.json({
      success: true,
      collaborations_created: createdCollaborations.length,
      collaborations: createdCollaborations,
    });

  } catch (error) {
    console.error('Error simulating collaboration:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});