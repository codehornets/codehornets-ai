/**
 * ============================================================================
 * n8n Custom External Hooks for Laravel Integration
 * ============================================================================
 * This file defines external hooks that integrate n8n with Laravel CRM.
 *
 * Hooks are triggered on various n8n events:
 * - workflow.postExecute: After workflow execution
 * - workflow.preExecute: Before workflow execution
 * - credentials.create: When credentials are created
 * - credentials.update: When credentials are updated
 * - credentials.delete: When credentials are deleted
 *
 * These hooks send notifications to Laravel API endpoints for:
 * - Execution tracking and logging
 * - Audit trails
 * - Workflow analytics
 * - Error monitoring
 * ============================================================================
 */

const axios = require('axios');

/**
 * Laravel API Configuration
 */
const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://app/api';
const LARAVEL_API_TOKEN = process.env.LARAVEL_API_TOKEN || '';

/**
 * HTTP client for Laravel API
 */
const laravelApi = axios.create({
    baseURL: LARAVEL_API_URL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LARAVEL_API_TOKEN}`,
        'X-Requested-With': 'n8n-webhook',
    },
});

/**
 * Utility: Safe API call with error handling
 */
async function safeLaravelApiCall(endpoint, data) {
    try {
        const response = await laravelApi.post(endpoint, data);
        console.log(`[n8n Hook] Successfully notified Laravel: ${endpoint}`);
        return response.data;
    } catch (error) {
        console.error(`[n8n Hook] Failed to notify Laravel: ${endpoint}`, {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
        });
        // Don't throw - external hooks should not break n8n execution
        return null;
    }
}

/**
 * ============================================================================
 * Hook Implementations
 * ============================================================================
 */
module.exports = {
    /**
     * After Workflow Execution
     * Triggered after every workflow execution completes
     */
    'workflow.postExecute': async function (workflow, runData, mode, workflowData) {
        const executionData = {
            workflow_id: workflow.id,
            workflow_name: workflow.name,
            execution_id: runData.executionId,
            mode: mode, // 'trigger', 'manual', 'webhook', etc.
            status: runData.finished ? 'success' : 'error',
            started_at: runData.startedAt,
            finished_at: runData.stoppedAt,
            execution_time: runData.stoppedAt - runData.startedAt,
            error: runData.data?.resultData?.error || null,
        };

        await safeLaravelApiCall('/n8n/webhooks/execution-complete', executionData);
    },

    /**
     * Before Workflow Execution
     * Triggered before workflow execution starts
     */
    'workflow.preExecute': async function (workflow, mode) {
        const executionData = {
            workflow_id: workflow.id,
            workflow_name: workflow.name,
            mode: mode,
            started_at: new Date().toISOString(),
        };

        await safeLaravelApiCall('/n8n/webhooks/execution-start', executionData);
    },

    /**
     * Credential Created
     * Triggered when new credentials are created
     */
    'credentials.create': async function (credentialData) {
        const auditData = {
            event: 'credential.created',
            credential_id: credentialData.id,
            credential_type: credentialData.type,
            credential_name: credentialData.name,
            created_at: new Date().toISOString(),
        };

        await safeLaravelApiCall('/n8n/webhooks/audit', auditData);
    },

    /**
     * Credential Updated
     * Triggered when credentials are updated
     */
    'credentials.update': async function (credentialData) {
        const auditData = {
            event: 'credential.updated',
            credential_id: credentialData.id,
            credential_type: credentialData.type,
            credential_name: credentialData.name,
            updated_at: new Date().toISOString(),
        };

        await safeLaravelApiCall('/n8n/webhooks/audit', auditData);
    },

    /**
     * Credential Deleted
     * Triggered when credentials are deleted
     */
    'credentials.delete': async function (credentialData) {
        const auditData = {
            event: 'credential.deleted',
            credential_id: credentialData.id,
            credential_type: credentialData.type,
            credential_name: credentialData.name,
            deleted_at: new Date().toISOString(),
        };

        await safeLaravelApiCall('/n8n/webhooks/audit', auditData);
    },

    /**
     * Workflow Activated
     * Triggered when a workflow is activated
     */
    'workflow.activate': async function (workflow) {
        const auditData = {
            event: 'workflow.activated',
            workflow_id: workflow.id,
            workflow_name: workflow.name,
            activated_at: new Date().toISOString(),
        };

        await safeLaravelApiCall('/n8n/webhooks/audit', auditData);
    },

    /**
     * Workflow Deactivated
     * Triggered when a workflow is deactivated
     */
    'workflow.deactivate': async function (workflow) {
        const auditData = {
            event: 'workflow.deactivated',
            workflow_id: workflow.id,
            workflow_name: workflow.name,
            deactivated_at: new Date().toISOString(),
        };

        await safeLaravelApiCall('/n8n/webhooks/audit', auditData);
    },
};

/**
 * ============================================================================
 * Laravel API Endpoints Expected
 * ============================================================================
 *
 * The Laravel CRM should implement these API endpoints:
 *
 * POST /api/n8n/webhooks/execution-start
 *   - Receives workflow execution start notifications
 *   - Stores execution tracking data
 *
 * POST /api/n8n/webhooks/execution-complete
 *   - Receives workflow execution completion notifications
 *   - Updates execution status and metrics
 *   - Triggers alerts on failures
 *
 * POST /api/n8n/webhooks/audit
 *   - Receives audit trail events
 *   - Logs credential and workflow changes
 *   - Maintains security audit log
 *
 * ============================================================================
 * Environment Variables Required
 * ============================================================================
 *
 * LARAVEL_API_URL - Base URL of Laravel API (e.g., http://app/api)
 * LARAVEL_API_TOKEN - Bearer token for API authentication
 *
 * Set in docker-compose.workflow.yml or .env.workflow
 * ============================================================================
 */
