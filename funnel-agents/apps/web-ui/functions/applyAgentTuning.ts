import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tuning_id, apply_recommendations, auto_apply } = await req.json();

    if (!tuning_id) {
      return Response.json({ error: 'tuning_id is required' }, { status: 400 });
    }

    // Fetch tuning record
    const tuningRecords = await base44.asServiceRole.entities.AgentPerformanceTuning.list();
    const tuning = tuningRecords.find(t => t.id === tuning_id);

    if (!tuning) {
      return Response.json({ error: 'Tuning record not found' }, { status: 404 });
    }

    // Fetch agent
    const agents = await base44.asServiceRole.entities.Agent.list();
    const agent = agents.find(a => a.id === tuning.agent_id);

    if (!agent) {
      return Response.json({ error: 'Agent not found' }, { status: 404 });
    }

    const appliedChanges = [];
    const updatedAgent = { ...agent };

    // Apply selected recommendations
    for (const recIndex of apply_recommendations) {
      const recommendation = tuning.recommendations[recIndex];
      
      if (!recommendation) continue;

      const change = {
        parameter: recommendation.category,
        old_value: recommendation.current_value,
        new_value: recommendation.recommended_value,
        applied_at: new Date().toISOString(),
        applied_by: user.email
      };

      // Apply changes based on category
      switch (recommendation.category) {
        case 'model':
          updatedAgent.model = recommendation.recommended_value;
          break;
        
        case 'temperature':
          updatedAgent.temperature = parseFloat(recommendation.recommended_value);
          break;
        
        case 'prompt':
          // Store prompt adjustments in learning_data
          if (!updatedAgent.learning_data) updatedAgent.learning_data = {};
          if (!updatedAgent.learning_data.prompt_adjustments) {
            updatedAgent.learning_data.prompt_adjustments = [];
          }
          updatedAgent.learning_data.prompt_adjustments.push({
            date: new Date().toISOString(),
            adjustment: recommendation.recommended_value,
            reason: recommendation.rationale
          });
          break;
        
        case 'behavior':
          // Parse behavior settings from recommendation
          try {
            const behaviorUpdate = JSON.parse(recommendation.recommended_value);
            updatedAgent.behavior_settings = {
              ...updatedAgent.behavior_settings,
              ...behaviorUpdate
            };
          } catch (e) {
            // If not JSON, treat as a single setting update
            const [key, value] = recommendation.recommended_value.split(':');
            if (key && value) {
              updatedAgent.behavior_settings[key.trim()] = 
                value.trim() === 'true' ? true : 
                value.trim() === 'false' ? false : 
                value.trim();
            }
          }
          break;
        
        case 'output_format':
          // Parse output format from recommendation
          try {
            const formatUpdate = JSON.parse(recommendation.recommended_value);
            updatedAgent.output_format_preferences = {
              ...updatedAgent.output_format_preferences,
              ...formatUpdate
            };
          } catch (e) {
            const [key, value] = recommendation.recommended_value.split(':');
            if (key && value) {
              updatedAgent.output_format_preferences[key.trim()] = value.trim();
            }
          }
          break;
        
        case 'tools':
          // Update tools configuration
          try {
            const toolsUpdate = JSON.parse(recommendation.recommended_value);
            updatedAgent.tools_config = {
              ...updatedAgent.tools_config,
              ...toolsUpdate
            };
          } catch (e) {
            // Handle as tool enablement
            if (recommendation.recommended_value.startsWith('enable:')) {
              const toolName = recommendation.recommended_value.replace('enable:', '').trim();
              if (!updatedAgent.tools_enabled.includes(toolName)) {
                updatedAgent.tools_enabled.push(toolName);
              }
            } else if (recommendation.recommended_value.startsWith('disable:')) {
              const toolName = recommendation.recommended_value.replace('disable:', '').trim();
              updatedAgent.tools_enabled = updatedAgent.tools_enabled.filter(t => t !== toolName);
            }
          }
          break;
      }

      appliedChanges.push(change);
    }

    // Update agent with new settings
    await base44.asServiceRole.entities.Agent.update(agent.id, updatedAgent);

    // Update tuning record
    await base44.asServiceRole.entities.AgentPerformanceTuning.update(tuning_id, {
      applied_changes: appliedChanges,
      status: 'applied',
      auto_applied: auto_apply || false
    });

    // Update agent's learning data
    await base44.asServiceRole.entities.Agent.update(agent.id, {
      learning_data: {
        ...updatedAgent.learning_data,
        last_tuning_date: new Date().toISOString(),
        tuning_count: (updatedAgent.learning_data?.tuning_count || 0) + 1
      }
    });

    return Response.json({
      success: true,
      applied_changes: appliedChanges,
      updated_agent: {
        id: updatedAgent.id,
        name: updatedAgent.name,
        model: updatedAgent.model,
        temperature: updatedAgent.temperature,
        behavior_settings: updatedAgent.behavior_settings,
        output_format_preferences: updatedAgent.output_format_preferences
      },
      monitoring_period: tuning.monitoring_period_days
    });

  } catch (error) {
    console.error('Error applying agent tuning:', error);
    return Response.json({ 
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
});