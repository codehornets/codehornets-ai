import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import {
  Task,
  ITaskRepository,
  TaskSearchParams,
  TaskStatus,
  TaskPriority,
  UniqueId,
  PaginationParams,
  PaginatedResult,
} from '@funnelagents/domain';
import { TaskDbEntity } from '../entities/task.entity';
import { BaseRepository } from '../base.repository';

@Injectable()
export class TaskRepository
  extends BaseRepository<TaskDbEntity, Task>
  implements ITaskRepository
{
  constructor(
    @InjectRepository(TaskDbEntity)
    repository: Repository<TaskDbEntity>
  ) {
    super(repository);
  }

  async findByStatus(
    status: TaskStatus,
    params?: PaginationParams
  ): Promise<PaginatedResult<Task>> {
    const qb = this.repository
      .createQueryBuilder('entity')
      .where('entity.status = :status', { status });

    return this.paginate(qb, params);
  }

  async findByAgent(
    agentId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<Task>> {
    const qb = this.repository
      .createQueryBuilder('entity')
      .where('entity.agentId = :agentId', { agentId });

    return this.paginate(qb, params);
  }

  async findByWorkspace(
    workspaceId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<Task>> {
    const qb = this.repository
      .createQueryBuilder('entity')
      .where('entity.workspaceId = :workspaceId', { workspaceId });

    return this.paginate(qb, params);
  }

  async findByCampaign(
    campaignId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<Task>> {
    const qb = this.repository
      .createQueryBuilder('entity')
      .where('entity.campaignId = :campaignId', { campaignId });

    return this.paginate(qb, params);
  }

  async findByPriority(
    priority: TaskPriority,
    params?: PaginationParams
  ): Promise<PaginatedResult<Task>> {
    const qb = this.repository
      .createQueryBuilder('entity')
      .where('entity.priority = :priority', { priority });

    return this.paginate(qb, params);
  }

  async findScheduledTasks(
    before: Date,
    params?: PaginationParams
  ): Promise<PaginatedResult<Task>> {
    const qb = this.repository
      .createQueryBuilder('entity')
      .where('entity.scheduledFor <= :before', { before })
      .andWhere('entity.status = :status', { status: TaskStatus.PENDING });

    return this.paginate(qb, params);
  }

  async search(searchParams: TaskSearchParams): Promise<PaginatedResult<Task>> {
    const qb = this.repository.createQueryBuilder('entity');

    if (searchParams.status) {
      qb.andWhere('entity.status = :status', { status: searchParams.status });
    }

    if (searchParams.priority) {
      qb.andWhere('entity.priority = :priority', { priority: searchParams.priority });
    }

    if (searchParams.type) {
      qb.andWhere('entity.type = :type', { type: searchParams.type });
    }

    if (searchParams.agentId) {
      qb.andWhere('entity.agentId = :agentId', { agentId: searchParams.agentId });
    }

    if (searchParams.workspaceId) {
      qb.andWhere('entity.workspaceId = :workspaceId', {
        workspaceId: searchParams.workspaceId,
      });
    }

    if (searchParams.campaignId) {
      qb.andWhere('entity.campaignId = :campaignId', {
        campaignId: searchParams.campaignId,
      });
    }

    if (searchParams.clientId) {
      qb.andWhere('entity.clientId = :clientId', { clientId: searchParams.clientId });
    }

    if (searchParams.scheduledBefore) {
      qb.andWhere('entity.scheduledFor <= :scheduledBefore', {
        scheduledBefore: searchParams.scheduledBefore,
      });
    }

    if (searchParams.scheduledAfter) {
      qb.andWhere('entity.scheduledFor >= :scheduledAfter', {
        scheduledAfter: searchParams.scheduledAfter,
      });
    }

    if (searchParams.tags && searchParams.tags.length > 0) {
      qb.andWhere('entity.tags && :tags', { tags: searchParams.tags });
    }

    return this.paginate(qb, searchParams);
  }

  async countByStatus(status: TaskStatus): Promise<number> {
    return this.repository.count({ where: { status } });
  }

  async countByAgent(agentId: string): Promise<number> {
    return this.repository.count({ where: { agentId } });
  }

  async findNextAvailable(agentId?: string): Promise<Task | null> {
    const qb = this.repository
      .createQueryBuilder('entity')
      .where('entity.status IN (:...statuses)', {
        statuses: [TaskStatus.PENDING, TaskStatus.QUEUED],
      })
      .orderBy('entity.priority', 'DESC')
      .addOrderBy('entity.createdAt', 'ASC')
      .limit(1);

    if (agentId) {
      qb.andWhere('entity.agentId = :agentId', { agentId });
    }

    const entity = await qb.getOne();
    return entity ? this.toDomain(entity) : null;
  }

  async findRunningTasks(agentId?: string): Promise<Task[]> {
    const where: any = { status: TaskStatus.RUNNING };
    if (agentId) {
      where.agentId = agentId;
    }

    const entities = await this.repository.find({ where });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findPendingRetries(): Promise<Task[]> {
    const entities = await this.repository.find({
      where: { status: TaskStatus.RETRYING },
      order: { failedAt: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  protected toDomain(entity: TaskDbEntity): Task {
    return Task.reconstitute(
      {
        title: entity.title,
        description: entity.description,
        type: entity.type as any,
        status: entity.status as TaskStatus,
        priority: entity.priority as TaskPriority,
        agentId: entity.agentId,
        inputData: entity.inputData,
        outputData: entity.outputData,
        executionLog: entity.executionLog.map((log) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        })),
        executionContext: {
          ...entity.executionContext,
          startedAt: entity.executionContext.startedAt
            ? new Date(entity.executionContext.startedAt)
            : undefined,
          endedAt: entity.executionContext.endedAt
            ? new Date(entity.executionContext.endedAt)
            : undefined,
        },
        metadata: entity.metadata,
        config: entity.config,
        scheduledFor: entity.scheduledFor,
        startedAt: entity.startedAt,
        completedAt: entity.completedAt,
        failedAt: entity.failedAt,
        cancelledAt: entity.cancelledAt,
      },
      UniqueId.fromString(entity.id)
    );
  }

  protected toDatabase(domain: Task): Partial<TaskDbEntity> {
    const executionLog = domain.executionLog.map((log) => ({
      ...log,
      timestamp: log.timestamp.toISOString(),
    }));

    const executionContext = {
      ...domain.executionContext,
      startedAt: domain.executionContext.startedAt?.toISOString(),
      endedAt: domain.executionContext.endedAt?.toISOString(),
    };

    return {
      id: domain.id.value,
      title: domain.title,
      description: domain.description,
      type: domain.type,
      status: domain.status,
      priority: domain.priority,
      agentId: domain.agentId,
      inputData: domain.inputData,
      outputData: domain.outputData,
      executionLog,
      executionContext,
      metadata: domain.metadata,
      config: domain.config,
      workspaceId: domain.workspaceId,
      campaignId: domain.campaignId,
      clientId: domain.clientId,
      scheduledFor: domain.scheduledFor,
      startedAt: domain.startedAt,
      completedAt: domain.completedAt,
      failedAt: domain.failedAt,
      cancelledAt: domain.cancelledAt,
      tags: domain.metadata.tags,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
