import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkflowsRepository, WorkflowFilters } from './workflows.repository';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { ExecuteWorkflowDto } from './dto/execute-workflow.dto';
import { Workflow } from './entities/workflow.entity';
import { WorkflowRunsService } from '../workflow-runs/workflow-runs.service';

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly workflowsRepository: WorkflowsRepository,
    private readonly workflowRunsService: WorkflowRunsService
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

    return this.workflowsRepository.create(workflow);
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

    return updated;
  }

  async delete(id: string): Promise<void> {
    const exists = await this.workflowsRepository.exists(id);
    if (!exists) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    await this.workflowsRepository.delete(id);
  }

  async execute(id: string, executeDto: ExecuteWorkflowDto): Promise<any> {
    const workflow = await this.findById(id);

    if (workflow.status !== 'active') {
      throw new BadRequestException(`Workflow must be active to execute. Current status: ${workflow.status}`);
    }

    // Create a workflow run
    const workflowRun = await this.workflowRunsService.create({
      workflow_id: workflow.id,
      trigger_type: workflow.trigger_type,
      trigger_data: executeDto.trigger_data,
      status: 'running',
    });

    // Start execution (for now, just mark as completed)
    // In the future, this would trigger actual node execution
    const completedRun = await this.workflowRunsService.markAsCompleted(workflowRun.id);

    return completedRun;
  }
}
