import { Repository } from 'typeorm';
import { Workflow, WorkflowStatus, TriggerType } from './entities/workflow.entity';
export interface WorkflowFilters {
    status?: WorkflowStatus;
    trigger_type?: TriggerType;
    workspace_id?: string;
}
export declare class WorkflowsRepository {
    private readonly repository;
    constructor(repository: Repository<Workflow>);
    findAll(filters?: WorkflowFilters): Promise<Workflow[]>;
    findById(id: string): Promise<Workflow | null>;
    create(workflow: Partial<Workflow>): Promise<Workflow>;
    update(id: string, updates: Partial<Workflow>): Promise<Workflow | null>;
    delete(id: string): Promise<void>;
    exists(id: string): Promise<boolean>;
}
