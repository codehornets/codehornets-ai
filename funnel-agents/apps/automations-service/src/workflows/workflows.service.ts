import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { WorkflowsRepository, WorkflowFilters } from './workflows.repository';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { ExecuteWorkflowDto } from './dto/execute-workflow.dto';
import { Workflow } from './entities/workflow.entity';
import { WorkflowExecutionEngine } from './engine/workflow-execution-engine';
import { ScheduledTriggerService } from './triggers/scheduled-trigger.service';

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(
    private readonly workflowsRepository: WorkflowsRepository,
    @Inject(forwardRef(() => WorkflowExecutionEngine))
    private readonly executionEngine: WorkflowExecutionEngine,
    @Inject(forwardRef(() => ScheduledTriggerService))
    private readonly scheduledTriggerService: ScheduledTriggerService
  ) {}

  async findAll(filters?: WorkflowFilters): Promise<Workflow[]> {
    return this.workflowsRepository.findAll(filters);
  }

  async findById(id: string): Promise<Workflow> {
    const workflow = await this.workflowsRepository.findById(id);
    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    return workflow;
  }

  async create(createDto: CreateWorkflowDto): Promise<Workflow> {
    const workflow = {
      ...createDto,
      status: createDto.status || 'draft',
      nodes: createDto.nodes || [],
      edges: createDto.edges || [],
    };

    const created = await this.workflowsRepository.create(workflow);
    this.logger.log(`Workflow created: ${created.id} (${created.name})`);

    // If workflow is scheduled and active, register it
    if (created.status === 'active' && created.trigger_type === 'scheduled') {
      await this.scheduledTriggerService.scheduleWorkflow(created);
    }

    return created;
  }

  async update(id: string, updateDto: UpdateWorkflowDto): Promise<Workflow> {
    const exists = await this.workflowsRepository.exists(id);
    if (!exists) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    const updated = await this.workflowsRepository.update(id, updateDto);
    if (!updated) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    this.logger.log(`Workflow updated: ${id}`);

    // Handle schedule changes
    if (updated.trigger_type === 'scheduled') {
      await this.scheduledTriggerService.rescheduleWorkflow(id);
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const exists = await this.workflowsRepository.exists(id);
    if (!exists) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    // Unschedule if scheduled
    this.scheduledTriggerService.unscheduleWorkflow(id);

    await this.workflowsRepository.delete(id);
    this.logger.log(`Workflow deleted: ${id}`);
  }

  /**
   * Execute a workflow using the execution engine
   */
  async execute(id: string, executeDto: ExecuteWorkflowDto): Promise<any> {
    const workflow = await this.findById(id);

    if (workflow.status !== 'active') {
      throw new BadRequestException(
        `Workflow must be active to execute. Current status: ${workflow.status}`
      );
    }

    this.logger.log(`Executing workflow: ${id} (${workflow.name})`);

    // Validate workflow before execution
    const validation = await this.executionEngine.validateWorkflow(id);
    if (!validation.valid) {
      throw new BadRequestException(
        `Workflow validation failed: ${validation.errors.join(', ')}`
      );
    }

    // Execute using the workflow execution engine
    const workflowRun = await this.executionEngine.executeWorkflow(
      id,
      executeDto.trigger_data || {}
    );

    return {
      workflowId: workflow.id,
      workflowName: workflow.name,
      runId: workflowRun.id,
      status: workflowRun.status,
      startedAt: workflowRun.started_at,
      completedAt: workflowRun.completed_at,
      executionLog: workflowRun.execution_log,
      error: workflowRun.error_message,
    };
  }

  /**
   * Validate a workflow without executing it
   */
  async validate(id: string): Promise<{ valid: boolean; errors: string[] }> {
    return this.executionEngine.validateWorkflow(id);
  }

  /**
   * Activate a workflow
   */
  async activate(id: string): Promise<Workflow> {
    // Validate before activating
    const validation = await this.executionEngine.validateWorkflow(id);
    if (!validation.valid) {
      throw new BadRequestException(
        `Cannot activate workflow with validation errors: ${validation.errors.join(', ')}`
      );
    }

    const updated = await this.update(id, { status: 'active' });
    this.logger.log(`Workflow activated: ${id}`);

    return updated;
  }

  /**
   * Pause a workflow
   */
  async pause(id: string): Promise<Workflow> {
    const updated = await this.update(id, { status: 'paused' });
    this.logger.log(`Workflow paused: ${id}`);

    return updated;
  }

  /**
   * Archive a workflow
   */
  async archive(id: string): Promise<Workflow> {
    const updated = await this.update(id, { status: 'archived' });
    this.logger.log(`Workflow archived: ${id}`);

    return updated;
  }
}
