import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflow_id, trigger_data = {} } = await req.json();

    if (!workflow_id) {
      return Response.json({ error: 'workflow_id is required' }, { status: 400 });
    }

    // Fetch workflow
    const workflows = await base44.asServiceRole.entities.AgentWorkflow.list();
    const workflow = workflows.find(w => w.id === workflow_id);

    if (!workflow) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (workflow.status !== 'active') {
      return Response.json({ error: 'Workflow is not active' }, { status: 400 });
    }

    // Create execution record
    const execution = await base44.asServiceRole.entities.WorkflowExecution.create({
      workflow_id: workflow.id,
      workflow_name: workflow.name,
      trigger_type: trigger_data.type || 'manual',
      trigger_data,
      status: 'running',
      started_at: new Date().toISOString()
    });

    const startTime = Date.now();
    const nodeResults = [];
    let workflowVariables = { ...workflow.variables, ...trigger_data };

    // Execute nodes in order based on edges
    const executeNode = async (nodeId, inputData = {}) => {
      const node = workflow.nodes.find(n => n.id === nodeId);
      if (!node) return null;

      // Update execution with current node
      await base44.asServiceRole.entities.WorkflowExecution.update(execution.id, {
        current_node: nodeId
      });

      const nodeStartTime = Date.now();
      let result = { node_id: nodeId, status: 'running', started_at: new Date().toISOString() };

      try {
        if (node.type === 'agent') {
          // Execute agent task
          const task = await base44.asServiceRole.entities.Task.create({
            title: `${workflow.name}: ${node.agent_name}`,
            description: node.config.instructions || '',
            agent_id: node.agent_id,
            agent_name: node.agent_name,
            status: 'pending',
            task_type: node.config.task_type || 'general',
            input_data: { ...inputData, ...workflowVariables },
            client_id: workflow.client_id,
            campaign_id: workflow.campaign_id
          });

          result.agent_name = node.agent_name;
          result.task_id = task.id;
          result.status = 'completed';
          result.output = { task_id: task.id, task_status: 'pending' };

        } else if (node.type === 'condition') {
          // Evaluate condition
          const conditionMet = evaluateCondition(node.config, workflowVariables);
          result.status = 'completed';
          result.output = { condition_met: conditionMet };
          workflowVariables.last_condition = conditionMet;

        } else if (node.type === 'delay') {
          // Delay execution
          const delayMs = node.config.delay_seconds * 1000;
          await new Promise(resolve => setTimeout(resolve, delayMs));
          result.status = 'completed';
          result.output = { delayed_ms: delayMs };

        } else if (node.type === 'notification') {
          // Send notification
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: node.config.recipient || user.email,
            subject: node.config.subject || `Workflow: ${workflow.name}`,
            body: node.config.body || 'Workflow step completed'
          });
          result.status = 'completed';
          result.output = { notification_sent: true };

        } else if (node.type === 'webhook') {
          // Call webhook
          const webhookResponse = await fetch(node.config.url, {
            method: node.config.method || 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...workflowVariables, node_id: nodeId })
          });
          result.status = 'completed';
          result.output = { status: webhookResponse.status };
        }

      } catch (error) {
        result.status = 'failed';
        result.error = error.message;
      }

      result.completed_at = new Date().toISOString();
      result.duration = (Date.now() - nodeStartTime) / 1000;
      nodeResults.push(result);

      return result;
    };

    // Helper to evaluate conditions
    const evaluateCondition = (config, vars) => {
      const { field, operator, value } = config;
      const fieldValue = vars[field];

      switch (operator) {
        case 'equals': return fieldValue === value;
        case 'not_equals': return fieldValue !== value;
        case 'greater_than': return fieldValue > value;
        case 'less_than': return fieldValue < value;
        case 'contains': return String(fieldValue).includes(value);
        default: return true;
      }
    };

    // Find start node (node with no incoming edges)
    const findStartNode = () => {
      const targetNodes = new Set(workflow.edges.map(e => e.target));
      return workflow.nodes.find(n => !targetNodes.has(n.id));
    };

    // Execute workflow nodes
    let currentNode = findStartNode();
    const executedNodes = new Set();

    while (currentNode && executedNodes.size < workflow.nodes.length) {
      executedNodes.add(currentNode.id);
      const result = await executeNode(currentNode.id, workflowVariables);

      if (result && result.output) {
        workflowVariables = { ...workflowVariables, ...result.output };
      }

      // Find next node
      const outgoingEdges = workflow.edges.filter(e => e.source === currentNode.id);
      if (outgoingEdges.length === 0) break;

      // Handle conditional edges
      let nextEdge = outgoingEdges[0];
      if (currentNode.type === 'condition' && outgoingEdges.length > 1) {
        const conditionMet = workflowVariables.last_condition;
        nextEdge = outgoingEdges.find(e => e.condition === (conditionMet ? 'true' : 'false')) || outgoingEdges[0];
      }

      currentNode = workflow.nodes.find(n => n.id === nextEdge.target);
    }

    // Update execution
    const duration = (Date.now() - startTime) / 1000;
    await base44.asServiceRole.entities.WorkflowExecution.update(execution.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      duration,
      node_results: nodeResults
    });

    // Update workflow stats
    await base44.asServiceRole.entities.AgentWorkflow.update(workflow_id, {
      execution_count: (workflow.execution_count || 0) + 1,
      success_count: (workflow.success_count || 0) + 1,
      last_run_at: new Date().toISOString(),
      avg_execution_time: ((workflow.avg_execution_time || 0) * (workflow.execution_count || 0) + duration) / ((workflow.execution_count || 0) + 1)
    });

    return Response.json({
      success: true,
      execution_id: execution.id,
      duration,
      nodes_executed: nodeResults.length,
      node_results: nodeResults
    });

  } catch (error) {
    console.error('Workflow execution error:', error);
    return Response.json({ 
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
});