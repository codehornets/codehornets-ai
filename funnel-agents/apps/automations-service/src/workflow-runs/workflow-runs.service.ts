import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { WorkflowRunsRepository, WorkflowRunFilters } from './workflow-runs.repository';
import { CreateWorkflowRunDto } from './dto/create-workflow-run.dto';
import { WorkflowRun, ExecutionLogEntry } from './entities/workflow-run.entity';

@Injectable()
export class WorkflowRunsService {
  private readonly logger = new Logger(WorkflowRunsService.name);

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

    const created = await this.workflowRunsRepository.create(workflowRun);
    this.logger.log(`Workflow run created: ${created.id} for workflow ${created.workflow_id}`);

    return created;
  }

  /**
   * Update execution log for a workflow run
   */
  async updateExecutionLog(
    id: string,
    logEntry: ExecutionLogEntry
  ): Promise<WorkflowRun> {
    const run = await this.findById(id);

    // Find existing entry or add new one
    const existingIndex = run.execution_log.findIndex(
      entry => entry.node_id === logEntry.node_id
    );

    if (existingIndex >= 0) {
      run.execution_log[existingIndex] = logEntry;
    } else {
      run.execution_log.push(logEntry);
    }

    const updated = await this.workflowRunsRepository.update(id, {
      execution_log: run.execution_log,
      current_node_id: logEntry.node_id,
    });

    if (!updated) {
      throw new NotFoundException(`Workflow run with ID ${id} not found`);
    }

    return updated;
  }

  /**
   * Mark a workflow run as completed
   */
  async markAsCompleted(id: string): Promise<WorkflowRun> {
    const updated = await this.workflowRunsRepository.update(id, {
      status: 'completed',
      completed_at: new Date(),
    });

    if (!updated) {
      throw new NotFoundException(`Workflow run with ID ${id} not found`);
    }

    this.logger.log(`Workflow run completed: ${id}`);

    return updated;
  }

  /**
   * Mark a workflow run as failed
   */
  async markAsFailed(id: string, errorMessage: string, errorStack?: string): Promise<WorkflowRun> {
    const updated = await this.workflowRunsRepository.update(id, {
      status: 'failed',
      completed_at: new Date(),
      error_message: errorStack ? `${errorMessage}\n\nStack trace:\n${errorStack}` : errorMessage,
    });

    if (!updated) {
      throw new NotFoundException(`Workflow run with ID ${id} not found`);
    }

    this.logger.error(`Workflow run failed: ${id} - ${errorMessage}`);

    return updated;
  }

  /**
   * Cancel a running workflow
   */
  async cancel(id: string): Promise<WorkflowRun> {
    const run = await this.findById(id);

    if (run.status !== 'running' && run.status !== 'pending') {
      throw new Error(`Cannot cancel workflow run with status: ${run.status}`);
    }

    const updated = await this.workflowRunsRepository.update(id, {
      status: 'cancelled',
      completed_at: new Date(),
      error_message: 'Workflow execution cancelled by user',
    });

    if (!updated) {
      throw new NotFoundException(`Workflow run with ID ${id} not found`);
    }

    this.logger.log(`Workflow run cancelled: ${id}`);

    return updated;
  }

  /**
   * Get execution statistics for a workflow run
   */
  async getExecutionStats(id: string): Promise<{
    totalNodes: number;
    completedNodes: number;
    failedNodes: number;
    skippedNodes: number;
    averageExecutionTime: number;
    totalExecutionTime: number;
  }> {
    const run = await this.findById(id);

    const totalNodes = run.execution_log.length;
    const completedNodes = run.execution_log.filter(entry => entry.status === 'completed').length;
    const failedNodes = run.execution_log.filter(entry => entry.status === 'failed').length;
    const skippedNodes = run.execution_log.filter(entry => entry.status === 'skipped').length;

    // Calculate execution times
    const executionTimes = run.execution_log
      .filter(entry => entry.started_at && entry.completed_at)
      .map(entry => {
        const start = new Date(entry.started_at!).getTime();
        const end = new Date(entry.completed_at!).getTime();
        return end - start;
      });

    const totalExecutionTime = executionTimes.reduce((sum, time) => sum + time, 0);
    const averageExecutionTime = executionTimes.length > 0
      ? totalExecutionTime / executionTimes.length
      : 0;

    return {
      totalNodes,
      completedNodes,
      failedNodes,
      skippedNodes,
      averageExecutionTime,
      totalExecutionTime,
    };
  }

  /**
   * Retry a failed workflow run
   */
  async retry(id: string): Promise<WorkflowRun> {
    const run = await this.findById(id);

    if (run.status !== 'failed') {
      throw new Error(`Can only retry failed workflow runs. Current status: ${run.status}`);
    }

    // Create a new run with the same configuration
    const newRun = await this.create({
      workflow_id: run.workflow_id,
      trigger_type: run.trigger_type,
      trigger_data: run.trigger_data,
      status: 'pending',
    });

    this.logger.log(`Workflow run retry created: ${newRun.id} (original: ${id})`);

    return newRun;
  }
}
