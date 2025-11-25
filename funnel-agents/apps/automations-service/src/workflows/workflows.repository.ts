import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Workflow, WorkflowStatus, TriggerType } from './entities/workflow.entity';

export interface WorkflowFilters {
  status?: WorkflowStatus;
  trigger_type?: TriggerType;
  workspace_id?: string;
}

@Injectable()
export class WorkflowsRepository {
  constructor(
    @InjectRepository(Workflow)
    private readonly repository: Repository<Workflow>
  ) {}

  async findAll(filters?: WorkflowFilters): Promise<Workflow[]> {
    const where: FindOptionsWhere<Workflow> = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.trigger_type) {
      where.trigger_type = filters.trigger_type;
    }
    if (filters?.workspace_id) {
      where.workspace_id = filters.workspace_id;
    }

    return this.repository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<Workflow | null> {
    return this.repository.findOne({ where: { id } });
  }

  async create(workflow: Partial<Workflow>): Promise<Workflow> {
    const entity = this.repository.create(workflow);
    return this.repository.save(entity);
  }

  async update(id: string, updates: Partial<Workflow>): Promise<Workflow | null> {
    await this.repository.update(id, updates);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }
}
