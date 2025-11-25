import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { ExecuteWorkflowDto } from './dto/execute-workflow.dto';
import { WorkflowFilters } from './workflows.repository';
export declare class WorkflowsController {
    private readonly workflowsService;
    constructor(workflowsService: WorkflowsService);
    findAll(filters?: WorkflowFilters): Promise<import("./entities/workflow.entity").Workflow[]>;
    findById(id: string): Promise<import("./entities/workflow.entity").Workflow>;
    create(createDto: CreateWorkflowDto): Promise<import("./entities/workflow.entity").Workflow>;
    update(id: string, updateDto: UpdateWorkflowDto): Promise<import("./entities/workflow.entity").Workflow>;
    delete(id: string): Promise<void>;
    execute(id: string, executeDto: ExecuteWorkflowDto): Promise<any>;
    validate(id: string): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    activate(id: string): Promise<import("./entities/workflow.entity").Workflow>;
    pause(id: string): Promise<import("./entities/workflow.entity").Workflow>;
    archive(id: string): Promise<import("./entities/workflow.entity").Workflow>;
}
