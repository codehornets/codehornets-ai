import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agent_id, improvements, auto_apply } = await req.json();

    if (!agent_id || !improvements) {
      return Response.json({ 
        error: 'agent_id and improvements are required' 
      }, { status: 400 });
    }

    // Fetch the agent
    const agents = await base44.asServiceRole.entities.Agent.filter({ id: agent_id });
    if (!agents.length) {
      return Response.json({ error: 'Agent not found' }, { status: 404 });
    }
    const agent = agents[0];

    const updateData = {};
    const appliedChanges = [];

    // Apply temperature adjustment
    if (improvements.parameter_adjustments?.temperature?.recommended !== undefined) {
      const newTemp = improvements.parameter_adjustments.temperature.recommended;
      // Validate temperature is between 0 and 1
      if (newTemp >= 0 && newTemp <= 1) {
        updateData.temperature = newTemp;
        appliedChanges.push({
          type: 'temperature',
          old: agent.temperature || 0.7,
          new: newTemp,
          reason: improvements.parameter_adjustments.temperature.reason
        });
      }
    }

    // Apply model change (if recommended and user approved)
    if (auto_apply && improvements.parameter_adjustments?.model?.recommended) {
      const newModel = improvements.parameter_adjustments.model.recommended;
      if (newModel !== agent.model) {
        updateData.model = newModel;
        appliedChanges.push({
          type: 'model',
          old: agent.model || 'gpt-4',
          new: newModel,
          reason: improvements.parameter_adjustments.model.reason
        });
      }
    }

    // Apply behavior tweaks
    if (improvements.parameter_adjustments?.behavior_tweaks?.length > 0) {
      const newBehaviorSettings = { ...(agent.behavior_settings || {}) };
      
      improvements.parameter_adjustments.behavior_tweaks.forEach(tweak => {
        if (auto_apply || tweak.priority === 'high') {
          newBehaviorSettings[tweak.setting] = tweak.recommended;
          appliedChanges.push({
            type: 'behavior',
            setting: tweak.setting,
            old: tweak.current,
            new: tweak.recommended,
            reason: tweak.reason
          });
        }
      });

      if (Object.keys(newBehaviorSettings).length > 0) {
        updateData.behavior_settings = newBehaviorSettings;
      }
    }

    // Apply output format tweaks
    if (improvements.parameter_adjustments?.output_format_tweaks?.length > 0) {
      const newFormatPrefs = { ...(agent.output_format_preferences || {}) };
      
      improvements.parameter_adjustments.output_format_tweaks.forEach(tweak => {
        if (auto_apply || tweak.priority === 'high') {
          newFormatPrefs[tweak.setting] = tweak.recommended;
          appliedChanges.push({
            type: 'output_format',
            setting: tweak.setting,
            old: tweak.current,
            new: tweak.recommended,
            reason: tweak.reason
          });
        }
      });

      if (Object.keys(newFormatPrefs).length > 0) {
        updateData.output_format_preferences = newFormatPrefs;
      }
    }

    // Store improvement recommendations in learning data
    const updatedLearningData = {
      ...(agent.learning_data || {}),
      last_improvement_applied: new Date().toISOString(),
      pending_retraining: improvements.retraining_recommendations || [],
      common_improvements: [
        ...(agent.learning_data?.common_improvements || []),
        ...improvements.priority_improvements?.map(i => i.issue) || []
      ].slice(-10) // Keep last 10
    };

    updateData.learning_data = updatedLearningData;

    // Apply updates if there are any
    if (Object.keys(updateData).length > 0) {
      await base44.asServiceRole.entities.Agent.update(agent_id, updateData);
    }

    return Response.json({
      success: true,
      agent_id,
      agent_name: agent.name,
      applied_changes: appliedChanges,
      pending_retraining: improvements.retraining_recommendations || [],
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Apply improvements error:', error);
    return Response.json({ 
      error: 'Failed to apply improvements', 
      details: error.message 
    }, { status: 500 });
  }
});