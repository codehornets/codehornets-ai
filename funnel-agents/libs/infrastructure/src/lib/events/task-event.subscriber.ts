import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  TaskCreatedEvent,
  TaskStartedEvent,
  TaskCompletedEvent,
  TaskFailedEvent,
  TaskCancelledEvent,
  TaskRetryingEvent,
  TaskStatusChangedEvent,
  TaskPriorityChangedEvent,
  TaskAssignedEvent,
} from '@funnelagents/domain';

@Injectable()
export class TaskEventSubscriber {
  @OnEvent('task.created')
  async handleTaskCreated(event: TaskCreatedEvent): Promise<void> {
    console.log('Task created:', {
      id: event.aggregateId,
      title: event.title,
      type: event.type,
      priority: event.priority,
      agentId: event.agentId,
      occurredOn: event.occurredOn,
    });

    // TODO: Publish to message bus for cross-service communication
    // TODO: Send notifications if configured
    // TODO: Update analytics/metrics
  }

  @OnEvent('task.started')
  async handleTaskStarted(event: TaskStartedEvent): Promise<void> {
    console.log('Task started:', {
      id: event.aggregateId,
      agentId: event.agentId,
      startedAt: event.startedAt,
      occurredOn: event.occurredOn,
    });

    // TODO: Update agent status
    // TODO: Start monitoring/timeout timer
    // TODO: Publish to message bus
  }

  @OnEvent('task.completed')
  async handleTaskCompleted(event: TaskCompletedEvent): Promise<void> {
    console.log('Task completed:', {
      id: event.aggregateId,
      agentId: event.agentId,
      executionTimeMs: event.executionTimeMs,
      occurredOn: event.occurredOn,
    });

    // TODO: Update agent metrics
    // TODO: Trigger dependent tasks
    // TODO: Send completion notifications
    // TODO: Archive task data
    // TODO: Publish to message bus
  }

  @OnEvent('task.failed')
  async handleTaskFailed(event: TaskFailedEvent): Promise<void> {
    console.log('Task failed:', {
      id: event.aggregateId,
      agentId: event.agentId,
      error: event.error,
      attempts: event.attempts,
      willRetry: event.willRetry,
      occurredOn: event.occurredOn,
    });

    // TODO: Log error details
    // TODO: Send failure alerts
    // TODO: Schedule retry if applicable
    // TODO: Update agent error metrics
    // TODO: Publish to message bus
  }

  @OnEvent('task.cancelled')
  async handleTaskCancelled(event: TaskCancelledEvent): Promise<void> {
    console.log('Task cancelled:', {
      id: event.aggregateId,
      reason: event.reason,
      cancelledBy: event.cancelledBy,
      occurredOn: event.occurredOn,
    });

    // TODO: Clean up resources
    // TODO: Send cancellation notifications
    // TODO: Update dependent tasks
    // TODO: Publish to message bus
  }

  @OnEvent('task.retrying')
  async handleTaskRetrying(event: TaskRetryingEvent): Promise<void> {
    console.log('Task retrying:', {
      id: event.aggregateId,
      attemptNumber: event.attemptNumber,
      maxRetries: event.maxRetries,
      delayMs: event.delayMs,
      occurredOn: event.occurredOn,
    });

    // TODO: Schedule retry with delay
    // TODO: Update retry metrics
    // TODO: Publish to message bus
  }

  @OnEvent('task.status_changed')
  async handleTaskStatusChanged(event: TaskStatusChangedEvent): Promise<void> {
    console.log('Task status changed:', {
      id: event.aggregateId,
      previousStatus: event.previousStatus,
      newStatus: event.newStatus,
      occurredOn: event.occurredOn,
    });

    // TODO: Update dashboards/UI
    // TODO: Send status change notifications
    // TODO: Update analytics
    // TODO: Publish to message bus
  }

  @OnEvent('task.priority_changed')
  async handleTaskPriorityChanged(event: TaskPriorityChangedEvent): Promise<void> {
    console.log('Task priority changed:', {
      id: event.aggregateId,
      previousPriority: event.previousPriority,
      newPriority: event.newPriority,
      occurredOn: event.occurredOn,
    });

    // TODO: Re-queue task with new priority
    // TODO: Update scheduling
    // TODO: Publish to message bus
  }

  @OnEvent('task.assigned')
  async handleTaskAssigned(event: TaskAssignedEvent): Promise<void> {
    console.log('Task assigned:', {
      id: event.aggregateId,
      agentId: event.agentId,
      previousAgentId: event.previousAgentId,
      occurredOn: event.occurredOn,
    });

    // TODO: Notify new agent
    // TODO: Update agent workload
    // TODO: Cancel previous agent's task if running
    // TODO: Publish to message bus
  }
}
