export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';
export type TriggerType = 'manual' | 'webhook' | 'event' | 'scheduled';
export type NodeType = 'trigger' | 'agent' | 'condition' | 'email' | 'delay' | 'webhook';
export interface WorkflowNode {
    id: string;
    type: NodeType;
    position: {
        x: number;
        y: number;
    };
    data: Record<string, any>;
}
export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    condition?: string;
}
export declare class Workflow {
    id: string;
    name: string;
    description?: string;
    status: WorkflowStatus;
    trigger_type: TriggerType;
    trigger_config?: Record<string, any>;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    workspace_id?: string;
    created_at: Date;
    updated_at: Date;
}
