import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_id } = await req.json();

    if (!client_id) {
      return Response.json({ error: 'client_id required' }, { status: 400 });
    }

    // Fetch all client data
    const [workspace, campaigns, tasks, leads] = await Promise.all([
      base44.entities.Workspace.filter({ id: client_id }).then(r => r[0]),
      base44.entities.Campaign.filter({ client_id }),
      base44.entities.Task.list('-created_date', 200),
      base44.entities.Lead.list('-created_date', 200),
    ]);

    if (!workspace) {
      return Response.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const clientTasks = tasks.filter(t => t.client_id === client_id);
    const clientCampaignIds = campaigns.map(c => c.id);
    const clientLeads = leads.filter(l => 
      l.converted_to_client_id === client_id || 
      (l.campaign_ids && l.campaign_ids.some(cid => clientCampaignIds.includes(cid)))
    );

    // Calculate metrics
    const totalTasks = clientTasks.length;
    const completedTasks = clientTasks.filter(t => t.status === 'completed').length;
    const failedTasks = clientTasks.filter(t => t.status === 'failed').length;
    const runningTasks = clientTasks.filter(t => t.status === 'running').length;
    const pendingTasks = clientTasks.filter(t => t.status === 'pending').length;

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentTasks = clientTasks.filter(t => new Date(t.created_date).getTime() > weekAgo);
    const recentCompletions = recentTasks.filter(t => t.status === 'completed').length;

    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalLeads = clientLeads.length;
    const qualifiedLeads = clientLeads.filter(l => l.status === 'qualified').length;

    // Prepare context for AI
    const analysisContext = {
      client_name: workspace.name,
      industry: workspace.industry,
      goals: workspace.goals || [],
      total_campaigns: campaigns.length,
      active_campaigns: activeCampaigns,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      failed_tasks: failedTasks,
      running_tasks: runningTasks,
      pending_tasks: pendingTasks,
      recent_completions_week: recentCompletions,
      total_leads: totalLeads,
      qualified_leads: qualifiedLeads,
      campaign_statuses: campaigns.map(c => ({ name: c.name, status: c.status, progress: c.progress })),
      recent_task_trends: recentTasks.slice(0, 10).map(t => ({ 
        title: t.title, 
        status: t.status, 
        priority: t.priority 
      }))
    };

    // Generate AI insights
    const insightsPrompt = `You are an AI consultant analyzing a client workspace. Based on the data below, provide:
1. ISSUES: 2-3 critical issues or blockers that need attention
2. OPPORTUNITIES: 2-3 growth opportunities or quick wins
3. NEXT_ACTIONS: 3-4 specific next best actions with clear priorities
4. CAMPAIGN_IDEAS: 2-3 new campaign ideas tailored to their goals

Client Data:
${JSON.stringify(analysisContext, null, 2)}

Rules:
- Be specific and actionable
- Reference actual metrics from the data
- Prioritize by impact
- Consider their industry: ${workspace.industry}
- Align with their goals: ${workspace.goals?.join(', ')}
- Identify patterns in task/campaign performance
- Flag stalled campaigns or underperforming areas

Return a structured response.`;

    const insights = await base44.integrations.Core.InvokeLLM({
      prompt: insightsPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                action_required: { type: "string" }
              }
            }
          },
          opportunities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                potential_impact: { type: "string" },
                effort: { type: "string", enum: ["low", "medium", "high"] }
              }
            }
          },
          next_actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string" },
                priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                estimated_time: { type: "string" },
                expected_outcome: { type: "string" }
              }
            }
          },
          campaign_ideas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                objective: { type: "string" },
                target_audience: { type: "string" },
                key_channels: { type: "array", items: { type: "string" } }
              }
            }
          },
          summary: { type: "string" }
        }
      }
    });

    // Generate executive report
    const reportPrompt = `Generate a concise executive summary report for ${workspace.name}.

Metrics:
- ${campaigns.length} campaigns (${activeCampaigns} active)
- ${completedTasks} completed tasks, ${failedTasks} failed
- ${totalLeads} leads (${qualifiedLeads} qualified)
- ${recentCompletions} tasks completed this week

Include:
1. Performance summary (2-3 sentences)
2. Key wins
3. Areas for improvement
4. Recommended focus areas

Be concise, positive but honest.`;

    const report = await base44.integrations.Core.InvokeLLM({
      prompt: reportPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          performance_summary: { type: "string" },
          key_wins: { type: "array", items: { type: "string" } },
          areas_for_improvement: { type: "array", items: { type: "string" } },
          recommended_focus: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({
      insights: {
        ...insights,
        generated_at: new Date().toISOString()
      },
      report: {
        ...report,
        metrics: {
          total_campaigns: campaigns.length,
          active_campaigns: activeCampaigns,
          completed_tasks: completedTasks,
          failed_tasks: failedTasks,
          total_leads: totalLeads,
          qualified_leads: qualifiedLeads,
          success_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        },
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});