import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IAgentRepository,
  Agent,
  AgentFilters,
  PaginationParams,
  PaginatedResult,
  UniqueId,
} from '@funnelagents/domain';
import { AgentDbEntity } from '../entities/agent.entity';
import { BaseRepository } from '../base.repository';

@Injectable()
export class AgentRepository implements IAgentRepository {
  constructor(
    @InjectRepository(AgentDbEntity)
    private readonly repository: Repository<AgentDbEntity>
  ) {}

  async findById(id: string): Promise<Agent | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<Agent>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((e) => this.toDomain(e)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findAvailableAgents(type?: string): Promise<Agent[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('agent')
      .where('agent.status IN (:...statuses)', { statuses: ['active', 'idle'] });

    if (type) {
      queryBuilder.andWhere('agent.domain = :type', { type });
    }

    const entities = await queryBuilder.getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async findWithFilters(
    filters: AgentFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<Agent>> {
    const queryBuilder = this.repository.createQueryBuilder('agent');

    if (filters.domain) {
      queryBuilder.andWhere('agent.domain = :domain', { domain: filters.domain });
    }

    if (filters.status) {
      queryBuilder.andWhere('agent.status = :status', { status: filters.status });
    }

    if (filters.skills && filters.skills.length > 0) {
      // PostgreSQL array contains query
      queryBuilder.andWhere('agent.skills && ARRAY[:...skills]', { skills: filters.skills });
    }

    if (filters.minSuccessRate !== undefined) {
      queryBuilder.andWhere('agent.success_rate >= :minSuccessRate', {
        minSuccessRate: filters.minSuccessRate,
      });
    }

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit).orderBy('agent.createdAt', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((e) => this.toDomain(e)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findByType(): Promise<PaginatedResult<Agent>> {
    return this.findAll();
  }

  async findByStatus(): Promise<Agent[]> {
    return [];
  }

  async save(agent: Agent): Promise<Agent> {
    const entity = this.toDatabase(agent);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  private toDomain(entity: AgentDbEntity): Agent {
    return Agent.reconstitute(
      {
        name: entity.name,
        type: entity.domain as any,
        description: entity.description,
        status: entity.status as any,
        capabilities: entity.skills.map((skill) => ({
          name: skill,
          description: skill,
        })),
        config: entity.settings || {},
        metrics: {
          tasksCompleted: entity.tasks_completed,
          averageExecutionTime: Number(entity.avg_completion_time) || 0,
          successRate: Number(entity.success_rate) || 0,
        },
      },
      UniqueId.fromString(entity.id)
    );
  }

  private toDatabase(agent: Agent): Partial<AgentDbEntity> {
    return {
      id: agent.id.value,
      name: agent.name,
      description: agent.description,
      domain: agent.type,
      status: agent.status,
      skills: agent.capabilities.map((c) => c.name),
      success_rate: agent.metrics?.successRate,
      tasks_completed: agent.metrics?.tasksCompleted || 0,
      avg_completion_time: agent.metrics?.averageExecutionTime,
      settings: agent.config,
      prompt_template: agent.config.systemPrompt,
      model: agent.config.model,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    };
  }
}
