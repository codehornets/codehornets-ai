/**
 * FunnelAgents - n8n Custom Hooks
 *
 * This file contains custom hooks for n8n workflow automation.
 * These hooks integrate n8n with FunnelAgents microservices.
 *
 * Available hook events:
 * - workflow.activate
 * - workflow.create
 * - workflow.delete
 * - workflow.execute.start
 * - workflow.execute.end
 * - workflow.activate
 * - n8n.ready
 */

module.exports = {
  /**
   * Called when n8n is ready
   */
  'n8n.ready': [
    async function() {
      console.log('[FunnelAgents] n8n is ready for workflow automation');
    }
  ],

  /**
   * Called when a workflow execution starts
   */
  'workflow.execute.start': [
    async function(workflowData) {
      console.log(`[FunnelAgents] Workflow started: ${workflowData.name}`);
      // TODO: Notify agents-service about workflow execution
    }
  ],

  /**
   * Called when a workflow execution ends
   */
  'workflow.execute.end': [
    async function(workflowData, executionData) {
      const status = executionData.data?.resultData?.error ? 'failed' : 'success';
      console.log(`[FunnelAgents] Workflow ended: ${workflowData.name} - Status: ${status}`);
      // TODO: Update task status in tasks-service
    }
  ],

  /**
   * Called when a workflow is activated
   */
  'workflow.activate': [
    async function(workflowData) {
      console.log(`[FunnelAgents] Workflow activated: ${workflowData.name}`);
      // TODO: Register workflow with automations-service
    }
  ]
};
