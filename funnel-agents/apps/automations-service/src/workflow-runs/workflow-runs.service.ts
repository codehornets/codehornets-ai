import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkflowRunsRepository, WorkflowRunFilters } from './workflow-runs.repository';
import { CreateWorkflowRunDto } from './dto/create-workflow-run.dto';
import { WorkflowRun, ExecutionLogEntry } from './entities/workflow-run.entity';

@Injectable()
export class WorkflowRunsService {
  constructor(
    private readonly workflowRunsRepository: WorkflowRunsRepository
  ) {}

  async findAll(filters?: WorkflowRunFilters): Promise<WorkflowRun[]> {
    return this.workflowRunsRepository.findAll(filters);
  }

  async findById(id: string): Promise<WorkflowRun> {
    const run = await this.workflowRunsRepository.findById(id);
    if (!run) {
      throw new NotFoundException(`Workflow run with ID ${id} not found`);
    }
    return run;
  }

  async create(createDto: CreateWorkflowRunDto): Promise<WorkflowRun> {
    const workflowRun = {
      ...createDto,
      status: createDto.status || 'pending',
      execution_log: [],
      started_at: createDto.status === 'running' ? new Date() : undefined,
    };

    return this.workflowRunsRepository.create(workflowRun);
  }

  async markAsCompleted(id: string): Promise<WorkflowRun> {
    const run = await this.findById(id);

    // Build a simple execution log (in future, this would be built during actual execution)
    const executionLog: ExecutionLogEntry[] = [];

    if (run.workflow?.nodes) {
      for (const node of run.workflow.nodes) {
        executionLog.push({
          node_id: node.id,
          node_type: node.type,
          status: 'completed',
          started_at: new Date(),
          completed_at: new Date(),
          input: {},
          output: { success: true },
        });
      }
    }

    const updated = await this.workflowRunsRepository.update(id, {
      status: 'completed',
      completed_at: new Date(),
      execution_log: executionLog,
    });

    if (!updated) {
      throw new NotFoundException(`Workflow run with ID ${id} not found`);
    }

    return updated;
  }

  async markAsFailed(id: string, errorMessage: string): Promise<WorkflowRun> {
    const updated = await this.workflowRunsRepository.update(id, {
      status: 'failed',
      completed_at: new Date(),
      error_message: errorMessage,
    });

    if (!updated) {
      throw new NotFoundException(`Workflow run with ID ${id} not found`);
    }

    return updated;
  }
}
