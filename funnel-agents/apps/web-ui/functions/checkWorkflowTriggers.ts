import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This function should be called periodically or by webhooks
    const { trigger_type, trigger_data } = await req.json();

    // Fetch all active workflows with this trigger type
    const workflows = await base44.asServiceRole.entities.AgentWorkflow.list();
    const matchingWorkflows = workflows.filter(w => 
      w.status === 'active' && 
      w.trigger?.type === trigger_type
    );

    const triggeredWorkflows = [];

    for (const workflow of matchingWorkflows) {
      // Check if trigger conditions are met
      let conditionsMet = true;

      if (workflow.trigger.conditions && workflow.trigger.conditions.length > 0) {
        for (const condition of workflow.trigger.conditions) {
          const fieldValue = trigger_data[condition.field];
          
          switch (condition.operator) {
            case 'equals':
              if (fieldValue !== condition.value) conditionsMet = false;
              break;
            case 'not_equals':
              if (fieldValue === condition.value) conditionsMet = false;
              break;
            case 'greater_than':
              if (fieldValue <= condition.value) conditionsMet = false;
              break;
            case 'less_than':
              if (fieldValue >= condition.value) conditionsMet = false;
              break;
            case 'contains':
              if (!String(fieldValue).includes(condition.value)) conditionsMet = false;
              break;
          }

          if (!conditionsMet) break;
        }
      }

      if (conditionsMet) {
        // Trigger workflow execution
        const executionResponse = await base44.asServiceRole.functions.invoke('executeWorkflow', {
          workflow_id: workflow.id,
          trigger_data: {
            type: trigger_type,
            ...trigger_data
          }
        });

        triggeredWorkflows.push({
          workflow_id: workflow.id,
          workflow_name: workflow.name,
          execution: executionResponse.data
        });
      }
    }

    return Response.json({
      success: true,
      trigger_type,
      workflows_triggered: triggeredWorkflows.length,
      executions: triggeredWorkflows
    });

  } catch (error) {
    console.error('Trigger check error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});