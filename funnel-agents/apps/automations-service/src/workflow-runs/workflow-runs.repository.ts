import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { WorkflowRun, WorkflowRunStatus } from './entities/workflow-run.entity';

export interface WorkflowRunFilters {
  workflow_id?: string;
  status?: WorkflowRunStatus;
  trigger_type?: string;
}

@Injectable()
export class WorkflowRunsRepository {
  constructor(
    @InjectRepository(WorkflowRun)
    private readonly repository: Repository<WorkflowRun>
  ) {}

  async findAll(filters?: WorkflowRunFilters): Promise<WorkflowRun[]> {
    const where: FindOptionsWhere<WorkflowRun> = {};

    if (filters?.workflow_id) {
      where.workflow_id = filters.workflow_id;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.trigger_type) {
      where.trigger_type = filters.trigger_type;
    }

    return this.repository.find({
      where,
      order: { created_at: 'DESC' },
      relations: ['workflow'],
    });
  }

  async findById(id: string): Promise<WorkflowRun | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['workflow'],
    });
  }

  async create(workflowRun: Partial<WorkflowRun>): Promise<WorkflowRun> {
    const entity = this.repository.create(workflowRun);
    return this.repository.save(entity);
  }

  async update(id: string, updates: Partial<WorkflowRun>): Promise<WorkflowRun | null> {
    await this.repository.update(id, updates);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
