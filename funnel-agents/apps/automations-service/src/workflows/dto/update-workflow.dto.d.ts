import { WorkflowStatus, TriggerType, WorkflowNode, WorkflowEdge } from '../entities/workflow.entity';
export declare class UpdateWorkflowDto {
    name?: string;
    description?: string;
    status?: WorkflowStatus;
    trigger_type?: TriggerType;
    trigger_config?: Record<string, any>;
    nodes?: WorkflowNode[];
    edges?: WorkflowEdge[];
    workspace_id?: string;
}
