import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IAgentTuningRepository,
  AgentPerformanceTuning,
  AgentTuningFilters,
  PaginationParams,
  PaginatedResult,
  UniqueId,
  TuningType,
} from '@funnelagents/domain';
import { AgentTuningDbEntity } from '../entities/agent-tuning.entity';
import { BaseRepository } from '../base.repository';

@Injectable()
export class AgentTuningRepository
  extends BaseRepository<AgentTuningDbEntity>
  implements IAgentTuningRepository
{
  constructor(
    @InjectRepository(AgentTuningDbEntity)
    repository: Repository<AgentTuningDbEntity>
  ) {
    super(repository);
  }

  async findById(id: string): Promise<AgentPerformanceTuning | null> {
    const entity = await super.findById(id);
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<AgentPerformanceTuning>> {
    const result = await super.findAll(params);
    return {
      data: result.data.map((e) => this.toDomain(e)),
      meta: result.meta,
    };
  }

  async findByAgentId(
    agentId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<AgentPerformanceTuning>> {
    const queryBuilder = this.repository
      .createQueryBuilder('tuning')
      .where('tuning.agent_id = :agentId', { agentId });

    const result = await this.paginate(queryBuilder, params);
    return {
      data: result.data.map((e) => this.toDomain(e)),
      meta: result.meta,
    };
  }

  async findWithFilters(
    filters: AgentTuningFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<AgentPerformanceTuning>> {
    const queryBuilder = this.repository.createQueryBuilder('tuning');

    if (filters.agentId) {
      queryBuilder.andWhere('tuning.agent_id = :agentId', { agentId: filters.agentId });
    }

    if (filters.tuningType) {
      queryBuilder.andWhere('tuning.tuning_type = :tuningType', {
        tuningType: filters.tuningType,
      });
    }

    if (filters.appliedOnly) {
      queryBuilder.andWhere('tuning.applied_at IS NOT NULL');
    }

    const result = await this.paginate(queryBuilder, params);
    return {
      data: result.data.map((e) => this.toDomain(e)),
      meta: result.meta,
    };
  }

  async save(tuning: AgentPerformanceTuning): Promise<AgentPerformanceTuning> {
    const entity = this.toDatabase(tuning);
    const saved = await super.save(entity);
    return this.toDomain(saved);
  }

  private toDomain(entity: AgentTuningDbEntity): AgentPerformanceTuning {
    return AgentPerformanceTuning.reconstitute(
      {
        agentId: entity.agent_id,
        tuningType: entity.tuning_type as TuningType,
        beforeValue: entity.before_value,
        afterValue: entity.after_value,
        performanceDelta: entity.performance_delta ? Number(entity.performance_delta) : undefined,
        notes: entity.notes,
        appliedAt: entity.applied_at,
      },
      UniqueId.fromString(entity.id)
    );
  }

  private toDatabase(tuning: AgentPerformanceTuning): Partial<AgentTuningDbEntity> {
    return {
      id: tuning.id.value,
      agent_id: tuning.agentId,
      tuning_type: tuning.tuningType,
      before_value: tuning.beforeValue,
      after_value: tuning.afterValue,
      performance_delta: tuning.performanceDelta,
      notes: tuning.notes,
      applied_at: tuning.appliedAt,
      createdAt: tuning.createdAt,
      updatedAt: tuning.updatedAt,
    };
  }
}
