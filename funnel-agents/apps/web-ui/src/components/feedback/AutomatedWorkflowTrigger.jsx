import client from '@/api/client';

/**
 * Utility to trigger workflows based on feedback submission
 * Call this after feedback is submitted
 */
export async function triggerFeedbackWorkflows(feedbackData) {
  try {
    const response = await client.functions.invoke('checkWorkflowTriggers', {
      trigger_type: 'client_feedback',
      trigger_data: {
        feedback_id: feedbackData.id,
        client_id: feedbackData.client_id,
        rating: feedbackData.rating,
        feedback_type: feedbackData.feedback_type,
        usefulness_score: feedbackData.usefulness_score,
        accuracy_score: feedbackData.accuracy_score
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to trigger feedback workflows:', error);
    return null;
  }
}

/**
 * Trigger workflows when task completes
 */
export async function triggerTaskCompletionWorkflows(taskData) {
  try {
    const response = await client.functions.invoke('checkWorkflowTriggers', {
      trigger_type: 'task_completed',
      trigger_data: {
        task_id: taskData.id,
        agent_id: taskData.agent_id,
        client_id: taskData.client_id,
        campaign_id: taskData.campaign_id,
        status: taskData.status,
        duration: taskData.duration
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to trigger task workflows:', error);
    return null;
  }
}

/**
 * Trigger workflows when task fails
 */
export async function triggerTaskFailureWorkflows(taskData) {
  try {
    const response = await client.functions.invoke('checkWorkflowTriggers', {
      trigger_type: 'task_failed',
      trigger_data: {
        task_id: taskData.id,
        agent_id: taskData.agent_id,
        client_id: taskData.client_id,
        error_message: taskData.error_message
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to trigger failure workflows:', error);
    return null;
  }
}

/**
 * Trigger workflows when agent performance drops
 */
export async function triggerPerformanceWorkflows(agentId, metrics) {
  try {
    const response = await client.functions.invoke('checkWorkflowTriggers', {
      trigger_type: 'agent_performance',
      trigger_data: {
        agent_id: agentId,
        success_rate: metrics.success_rate,
        avg_rating: metrics.avg_rating
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to trigger performance workflows:', error);
    return null;
  }
}