import { WorkflowRunStatus } from '../entities/workflow-run.entity';
export declare class CreateWorkflowRunDto {
    workflow_id: string;
    status?: WorkflowRunStatus;
    trigger_type: string;
    trigger_data?: Record<string, any>;
}
