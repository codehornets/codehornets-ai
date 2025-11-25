import { Workflow } from '../../workflows/entities/workflow.entity';
export type WorkflowRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export interface ExecutionLogEntry {
    node_id: string;
    node_type: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    started_at?: Date;
    completed_at?: Date;
    input?: Record<string, any>;
    output?: Record<string, any>;
    error?: string;
}
export declare class WorkflowRun {
    id: string;
    workflow_id: string;
    workflow?: Workflow;
    status: WorkflowRunStatus;
    trigger_type: string;
    trigger_data?: Record<string, any>;
    current_node_id?: string;
    execution_log: ExecutionLogEntry[];
    error_message?: string;
    started_at?: Date;
    completed_at?: Date;
    created_at: Date;
}
