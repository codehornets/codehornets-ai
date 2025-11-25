import { WorkflowsRepository, WorkflowFilters } from './workflows.repository';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { ExecuteWorkflowDto } from './dto/execute-workflow.dto';
import { Workflow } from './entities/workflow.entity';
import { WorkflowExecutionEngine } from './engine/workflow-execution-engine';
import { ScheduledTriggerService } from './triggers/scheduled-trigger.service';
export declare class WorkflowsService {
    private readonly workflowsRepository;
    private readonly executionEngine;
    private readonly scheduledTriggerService;
    private readonly logger;
    constructor(workflowsRepository: WorkflowsRepository, executionEngine: WorkflowExecutionEngine, scheduledTriggerService: ScheduledTriggerService);
    findAll(filters?: WorkflowFilters): Promise<Workflow[]>;
    findById(id: string): Promise<Workflow>;
    create(createDto: CreateWorkflowDto): Promise<Workflow>;
    update(id: string, updateDto: UpdateWorkflowDto): Promise<Workflow>;
    delete(id: string): Promise<void>;
    /**
     * Execute a workflow using the execution engine
     */
    execute(id: string, executeDto: ExecuteWorkflowDto): Promise<any>;
    /**
     * Validate a workflow without executing it
     */
    validate(id: string): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    /**
     * Activate a workflow
     */
    activate(id: string): Promise<Workflow>;
    /**
     * Pause a workflow
     */
    pause(id: string): Promise<Workflow>;
    /**
     * Archive a workflow
     */
    archive(id: string): Promise<Workflow>;
}
