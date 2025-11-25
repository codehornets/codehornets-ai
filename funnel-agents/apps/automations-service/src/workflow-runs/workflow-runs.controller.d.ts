import { WorkflowRunsService } from './workflow-runs.service';
import { CreateWorkflowRunDto } from './dto/create-workflow-run.dto';
import { WorkflowRunFilters } from './workflow-runs.repository';
export declare class WorkflowRunsController {
    private readonly workflowRunsService;
    constructor(workflowRunsService: WorkflowRunsService);
    findAll(filters?: WorkflowRunFilters): Promise<import("./entities/workflow-run.entity").WorkflowRun[]>;
    findById(id: string): Promise<import("./entities/workflow-run.entity").WorkflowRun>;
    create(createDto: CreateWorkflowRunDto): Promise<import("./entities/workflow-run.entity").WorkflowRun>;
    cancel(id: string): Promise<import("./entities/workflow-run.entity").WorkflowRun>;
    retry(id: string): Promise<import("./entities/workflow-run.entity").WorkflowRun>;
    getStats(id: string): Promise<{
        totalNodes: number;
        completedNodes: number;
        failedNodes: number;
        skippedNodes: number;
        averageExecutionTime: number;
        totalExecutionTime: number;
    }>;
}
