import { WorkflowRunsRepository, WorkflowRunFilters } from './workflow-runs.repository';
import { CreateWorkflowRunDto } from './dto/create-workflow-run.dto';
import { WorkflowRun, ExecutionLogEntry } from './entities/workflow-run.entity';
export declare class WorkflowRunsService {
    private readonly workflowRunsRepository;
    private readonly logger;
    constructor(workflowRunsRepository: WorkflowRunsRepository);
    findAll(filters?: WorkflowRunFilters): Promise<WorkflowRun[]>;
    findById(id: string): Promise<WorkflowRun>;
    create(createDto: CreateWorkflowRunDto): Promise<WorkflowRun>;
    /**
     * Update execution log for a workflow run
     */
    updateExecutionLog(id: string, logEntry: ExecutionLogEntry): Promise<WorkflowRun>;
    /**
     * Mark a workflow run as completed
     */
    markAsCompleted(id: string): Promise<WorkflowRun>;
    /**
     * Mark a workflow run as failed
     */
    markAsFailed(id: string, errorMessage: string, errorStack?: string): Promise<WorkflowRun>;
    /**
     * Cancel a running workflow
     */
    cancel(id: string): Promise<WorkflowRun>;
    /**
     * Get execution statistics for a workflow run
     */
    getExecutionStats(id: string): Promise<{
        totalNodes: number;
        completedNodes: number;
        failedNodes: number;
        skippedNodes: number;
        averageExecutionTime: number;
        totalExecutionTime: number;
    }>;
    /**
     * Retry a failed workflow run
     */
    retry(id: string): Promise<WorkflowRun>;
}
