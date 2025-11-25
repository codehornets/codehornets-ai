import { useState, useEffect, useCallback, useRef } from 'react';
import { appParams } from '@/lib/app-params';
import { useWebSocket, WS_CHANNELS, WS_EVENTS } from './useWebSocket';

/**
 * Hook for executing AI agents with real-time progress updates
 *
 * Features:
 * - Execute agents via REST API
 * - Real-time progress updates via WebSocket
 * - Polling fallback if WebSocket unavailable
 * - Retry logic with exponential backoff
 * - Error handling and recovery
 *
 * @returns {Object} Agent execution state and methods
 */
export function useAgentExecution() {
  const [status, setStatus] = useState('idle'); // idle, running, completed, failed
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [executionId, setExecutionId] = useState(null);
  const [logs, setLogs] = useState([]);

  const pollingIntervalRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const baseRetryDelay = 1000; // 1 second

  const ws = useWebSocket();

  // Get API base URL
  const getApiUrl = useCallback(() => {
    return appParams.serverUrl || import.meta.env.VITE_BASE44_BACKEND_URL || 'http://localhost:3000';
  }, []);

  // Add log entry
  const addLog = useCallback((message, level = 'info') => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      level,
      message
    }]);
  }, []);

  // Clear execution state
  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setError(null);
    setExecutionId(null);
    setLogs([]);
    retryCountRef.current = 0;

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Poll for execution status (fallback when WebSocket unavailable)
  const pollExecutionStatus = useCallback(async (execId) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/agents/executions/${execId}`, {
          headers: {
            'Authorization': `Bearer ${appParams.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch execution status: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          const execution = data.data;
          setProgress(execution.progress || 0);

          if (execution.logs && execution.logs.length > 0) {
            setLogs(execution.logs);
          }

          if (execution.status === 'completed') {
            setStatus('completed');
            setResult(execution.output_data);
            setProgress(100);
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          } else if (execution.status === 'failed') {
            setStatus('failed');
            setError(execution.error || new Error('Agent execution failed'));
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      } catch (err) {
        console.error('Error polling execution status:', err);
        // Don't stop polling on transient errors, just log them
        addLog(`Polling error: ${err.message}`, 'warning');
      }
    }, 2000); // Poll every 2 seconds
  }, [getApiUrl, addLog]);

  // Execute agent
  const executeAgent = useCallback(async (agentType, input, options = {}) => {
    const {
      timeout = 300,
      priority = 'normal',
      useAsync = false,
      retryOnFailure = true,
    } = options;

    reset();
    setStatus('running');
    addLog(`Starting agent execution: ${agentType}`);

    try {
      const apiUrl = getApiUrl();

      // First, find or get the agent by type
      let agentId;
      try {
        const agentsResponse = await fetch(`${apiUrl}/api/agents?type=${agentType}&limit=1`, {
          headers: {
            'Authorization': `Bearer ${appParams.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!agentsResponse.ok) {
          throw new Error('Failed to fetch agent');
        }

        const agentsData = await agentsResponse.json();
        if (agentsData.success && agentsData.data && agentsData.data.length > 0) {
          agentId = agentsData.data[0].id;
        } else {
          throw new Error(`Agent type "${agentType}" not found`);
        }
      } catch (err) {
        addLog(`Error fetching agent: ${err.message}`, 'error');
        throw err;
      }

      addLog(`Agent ID: ${agentId}`);

      // Execute the agent
      const endpoint = useAsync
        ? `${apiUrl}/api/agents/${agentId}/execute/async`
        : `${apiUrl}/api/agents/${agentId}/execute`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${appParams.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input,
          timeout,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Agent execution failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Agent execution failed');
      }

      const execId = data.data.execution_id;
      setExecutionId(execId);
      addLog(`Execution started with ID: ${execId}`);

      if (useAsync) {
        // For async execution, subscribe to WebSocket updates
        if (ws.isConnected) {
          ws.subscribe(WS_CHANNELS.AGENTS);
          addLog('Subscribed to WebSocket updates');
        } else {
          // Fallback to polling
          addLog('WebSocket unavailable, using polling fallback');
          pollExecutionStatus(execId);
        }
      } else {
        // For sync execution, we get the result immediately
        if (data.data.status === 'completed') {
          setStatus('completed');
          setResult(data.data.output_data);
          setProgress(100);
          if (data.data.logs) {
            setLogs(data.data.logs.map(log => ({
              timestamp: log.timestamp || new Date().toISOString(),
              level: log.level || 'info',
              message: log.message
            })));
          }
          addLog('Execution completed successfully');
        } else if (data.data.status === 'failed') {
          throw new Error(data.data.error?.message || 'Agent execution failed');
        }
      }

      retryCountRef.current = 0; // Reset retry count on success
      return data.data;

    } catch (err) {
      console.error('Agent execution error:', err);
      addLog(`Execution error: ${err.message}`, 'error');
      setError(err);

      // Retry logic with exponential backoff
      if (retryOnFailure && retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        const delay = baseRetryDelay * Math.pow(2, retryCountRef.current - 1);
        addLog(`Retrying in ${delay}ms... (attempt ${retryCountRef.current}/${maxRetries})`, 'warning');

        await new Promise(resolve => setTimeout(resolve, delay));
        return executeAgent(agentType, input, options);
      }

      setStatus('failed');
      throw err;
    }
  }, [getApiUrl, addLog, reset, pollExecutionStatus, ws]);

  // Cancel execution
  const cancelExecution = useCallback(async () => {
    if (!executionId) {
      return;
    }

    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/agents/executions/${executionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${appParams.token}`,
          'Content-Type': 'application/json',
        },
      });

      setStatus('idle');
      addLog('Execution cancelled');
    } catch (err) {
      console.error('Error cancelling execution:', err);
      addLog(`Cancel error: ${err.message}`, 'error');
    }
  }, [executionId, getApiUrl, addLog]);

  // Handle WebSocket events
  useEffect(() => {
    if (!ws.isConnected || !executionId) {
      return;
    }

    const unsubscribeProgress = ws.on(WS_EVENTS.AGENT_PROGRESS, (data) => {
      if (data.execution_id === executionId) {
        setProgress(data.progress || 0);
        if (data.message) {
          addLog(data.message);
        }
      }
    });

    const unsubscribeCompleted = ws.on(WS_EVENTS.AGENT_COMPLETED, (data) => {
      if (data.execution_id === executionId) {
        setStatus('completed');
        setResult(data.result || data.output_data);
        setProgress(100);
        addLog('Execution completed successfully');

        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    });

    const unsubscribeFailed = ws.on(WS_EVENTS.AGENT_FAILED, (data) => {
      if (data.execution_id === executionId) {
        setStatus('failed');
        setError(new Error(data.error?.message || 'Agent execution failed'));
        addLog(`Execution failed: ${data.error?.message}`, 'error');

        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    });

    return () => {
      unsubscribeProgress();
      unsubscribeCompleted();
      unsubscribeFailed();
    };
  }, [ws, executionId, addLog]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    status,
    progress,
    result,
    error,
    executionId,
    logs,
    executeAgent,
    cancelExecution,
    reset,
    isRunning: status === 'running',
    isCompleted: status === 'completed',
    isFailed: status === 'failed',
    isIdle: status === 'idle',
  };
}

// Helper hook for lead qualification specifically
export function useLeadQualification() {
  const agentExecution = useAgentExecution();

  const qualifyLead = useCallback(async (leadData) => {
    const input = {
      lead_id: leadData.id,
      name: leadData.name,
      email: leadData.email,
      company: leadData.company,
      phone: leadData.phone,
      website: leadData.website,
      industry: leadData.industry,
      source: leadData.source,
      notes: leadData.notes,
    };

    return agentExecution.executeAgent('lead-qualification', input, {
      useAsync: true,
      timeout: 120, // 2 minutes
      retryOnFailure: true,
    });
  }, [agentExecution]);

  return {
    ...agentExecution,
    qualifyLead,
  };
}

// Helper hook for content generation
export function useContentGeneration() {
  const agentExecution = useAgentExecution();

  const generateContent = useCallback(async (contentType, params) => {
    const input = {
      content_type: contentType,
      ...params,
    };

    return agentExecution.executeAgent('content-generation', input, {
      useAsync: true,
      timeout: 180, // 3 minutes
      retryOnFailure: true,
    });
  }, [agentExecution]);

  return {
    ...agentExecution,
    generateContent,
  };
}

// Helper hook for campaign optimization
export function useCampaignOptimization() {
  const agentExecution = useAgentExecution();

  const optimizeCampaign = useCallback(async (campaignData) => {
    const input = {
      campaign_id: campaignData.id,
      ...campaignData,
    };

    return agentExecution.executeAgent('campaign-optimization', input, {
      useAsync: true,
      timeout: 180, // 3 minutes
      retryOnFailure: true,
    });
  }, [agentExecution]);

  return {
    ...agentExecution,
    optimizeCampaign,
  };
}

// Helper hook for contact enrichment
export function useContactEnrichment() {
  const agentExecution = useAgentExecution();

  const enrichContact = useCallback(async (contactData) => {
    const input = {
      contact_id: contactData.id,
      email: contactData.email,
      company: contactData.company,
      linkedin: contactData.linkedin,
    };

    return agentExecution.executeAgent('contact-enrichment', input, {
      useAsync: true,
      timeout: 90, // 1.5 minutes
      retryOnFailure: true,
    });
  }, [agentExecution]);

  return {
    ...agentExecution,
    enrichContact,
  };
}
