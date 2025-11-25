import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflow_id } = await req.json();

    if (!workflow_id) {
      return Response.json({ error: 'workflow_id is required' }, { status: 400 });
    }

    // Fetch workflow and execution history
    const workflows = await base44.asServiceRole.entities.AgentWorkflow.list();
    const workflow = workflows.find(w => w.id === workflow_id);

    if (!workflow) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const executions = await base44.asServiceRole.entities.WorkflowExecution.list();
    const workflowExecutions = executions
      .filter(e => e.workflow_id === workflow_id)
      .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
      .slice(0, 50);

    // Calculate performance metrics
    const totalExecutions = workflowExecutions.length;
    const completedExecutions = workflowExecutions.filter(e => e.status === 'completed').length;
    const failedExecutions = workflowExecutions.filter(e => e.status === 'failed').length;
    const successRate = totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0;

    const avgDuration = workflowExecutions
      .filter(e => e.duration)
      .reduce((sum, e, i, arr) => sum + (e.duration || 0) / arr.length, 0);

    // Analyze node performance
    const nodePerformance = {};
    workflowExecutions.forEach(execution => {
      execution.node_results?.forEach(result => {
        if (!nodePerformance[result.node_id]) {
          nodePerformance[result.node_id] = {
            node_id: result.node_id,
            agent_name: result.agent_name,
            executions: 0,
            failures: 0,
            totalTime: 0,
            errors: [],
          };
        }
        nodePerformance[result.node_id].executions += 1;
        if (result.status === 'failed') {
          nodePerformance[result.node_id].failures += 1;
          if (result.error) nodePerformance[result.node_id].errors.push(result.error);
        }
        if (result.started_at && result.completed_at) {
          const duration = new Date(result.completed_at).getTime() - new Date(result.started_at).getTime();
          nodePerformance[result.node_id].totalTime += duration;
        }
      });
    });

    // Identify bottlenecks
    const bottlenecks = Object.values(nodePerformance)
      .map(node => ({
        ...node,
        avgTime: node.executions > 0 ? node.totalTime / node.executions : 0,
        failureRate: node.executions > 0 ? (node.failures / node.executions) * 100 : 0,
      }))
      .filter(node => node.failureRate > 20 || node.avgTime > 30000);

    // Build analysis context
    const context = `
Workflow: ${workflow.name}
Description: ${workflow.description || 'No description'}
Status: ${workflow.status}
Trigger: ${workflow.trigger?.type || 'manual'}

Performance Metrics:
- Total Executions: ${totalExecutions}
- Success Rate: ${successRate.toFixed(1)}%
- Failed Executions: ${failedExecutions}
- Avg Duration: ${(avgDuration / 1000).toFixed(1)}s

Current Structure:
- Nodes: ${workflow.nodes?.length || 0}
- Edges: ${workflow.edges?.length || 0}

Node Performance:
${Object.values(nodePerformance).map(node => `
- ${node.agent_name || node.node_id}:
  * Executions: ${node.executions}
  * Failures: ${node.failures} (${((node.failures / node.executions) * 100).toFixed(1)}%)
  * Avg Time: ${((node.totalTime / node.executions) / 1000).toFixed(1)}s
  * Recent Errors: ${node.errors.slice(0, 2).join(', ') || 'None'}
`).join('\n')}

Identified Bottlenecks:
${bottlenecks.map(b => `- ${b.agent_name}: ${b.failureRate.toFixed(1)}% failure rate, ${(b.avgTime / 1000).toFixed(1)}s avg time`).join('\n') || 'None'}
`;

    // Generate optimization suggestions
    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a workflow optimization expert. Analyze this workflow execution data and provide specific optimization recommendations.

${context}

Provide recommendations in the following JSON structure:
{
  "overall_assessment": "Brief assessment of workflow health",
  "performance_score": 85,
  "bottlenecks": [
    {
      "node_id": "affected node",
      "issue": "description of issue",
      "severity": "high/medium/low"
    }
  ],
  "optimizations": [
    {
      "type": "node_optimization/edge_optimization/trigger_optimization/structure",
      "target": "node_id or general",
      "title": "optimization title",
      "description": "detailed explanation",
      "expected_impact": "what will improve",
      "implementation": "how to apply this",
      "priority": "high/medium/low"
    }
  ],
  "quick_wins": ["quick fix 1", "quick fix 2"]
}

Focus on:
1. Reducing failure rates
2. Improving execution time
3. Better trigger configuration
4. Optimal node ordering
5. Parallelization opportunities
6. Resource efficiency`,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_assessment: { type: 'string' },
          performance_score: { type: 'number' },
          bottlenecks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                node_id: { type: 'string' },
                issue: { type: 'string' },
                severity: { type: 'string' }
              }
            }
          },
          optimizations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                target: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                expected_impact: { type: 'string' },
                implementation: { type: 'string' },
                priority: { type: 'string' }
              }
            }
          },
          quick_wins: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    });

    return Response.json({
      workflow_id,
      workflow_name: workflow.name,
      analysis: llmResponse,
      metrics: {
        totalExecutions,
        successRate,
        avgDuration,
        failedExecutions,
      },
      analyzed_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error analyzing workflow:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});