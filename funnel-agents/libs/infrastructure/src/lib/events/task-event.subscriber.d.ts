import { TaskCreatedEvent, TaskStartedEvent, TaskCompletedEvent, TaskFailedEvent, TaskCancelledEvent, TaskRetryingEvent, TaskStatusChangedEvent, TaskPriorityChangedEvent, TaskAssignedEvent } from '@funnelagents/domain';
export declare class TaskEventSubscriber {
    handleTaskCreated(event: TaskCreatedEvent): Promise<void>;
    handleTaskStarted(event: TaskStartedEvent): Promise<void>;
    handleTaskCompleted(event: TaskCompletedEvent): Promise<void>;
    handleTaskFailed(event: TaskFailedEvent): Promise<void>;
    handleTaskCancelled(event: TaskCancelledEvent): Promise<void>;
    handleTaskRetrying(event: TaskRetryingEvent): Promise<void>;
    handleTaskStatusChanged(event: TaskStatusChangedEvent): Promise<void>;
    handleTaskPriorityChanged(event: TaskPriorityChangedEvent): Promise<void>;
    handleTaskAssigned(event: TaskAssignedEvent): Promise<void>;
}
