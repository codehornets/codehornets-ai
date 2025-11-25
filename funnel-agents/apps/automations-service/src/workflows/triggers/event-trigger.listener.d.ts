import { WorkflowsRepository } from '../workflows.repository';
import { WorkflowExecutionEngine } from '../engine/workflow-execution-engine';
export interface WorkflowEvent {
    name: string;
    payload: Record<string, any>;
    timestamp: Date;
    source?: string;
}
/**
 * EventTriggerListener - Listens to application events and triggers workflows
 * Responds to domain events emitted by other services
 */
export declare class EventTriggerListener {
    private readonly workflowsRepository;
    private readonly executionEngine;
    private readonly logger;
    constructor(workflowsRepository: WorkflowsRepository, executionEngine: WorkflowExecutionEngine);
    /**
     * Listen to all workflow events
     * Events should be emitted with the pattern: workflow.trigger.<eventName>
     */
    handleWorkflowTriggerEvent(event: WorkflowEvent): Promise<void>;
    /**
     * Listen to specific common events
     */
    handleUserCreated(payload: Record<string, any>): Promise<void>;
    handleUserUpdated(payload: Record<string, any>): Promise<void>;
    handleLeadCreated(payload: Record<string, any>): Promise<void>;
    handleLeadUpdated(payload: Record<string, any>): Promise<void>;
    handleConversationCompleted(payload: Record<string, any>): Promise<void>;
    handleTaskCompleted(payload: Record<string, any>): Promise<void>;
    handlePaymentReceived(payload: Record<string, any>): Promise<void>;
}
