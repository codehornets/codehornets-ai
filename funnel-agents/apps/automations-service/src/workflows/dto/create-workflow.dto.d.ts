import { WorkflowStatus, TriggerType, WorkflowNode, WorkflowEdge } from '../entities/workflow.entity';
export declare class CreateWorkflowDto {
    name: string;
    description?: string;
    status?: WorkflowStatus;
    trigger_type: TriggerType;
    trigger_config?: Record<string, any>;
    nodes?: WorkflowNode[];
    edges?: WorkflowEdge[];
    workspace_id?: string;
}
