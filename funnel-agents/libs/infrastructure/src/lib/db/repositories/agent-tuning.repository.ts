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
  extends BaseRepository<AgentTuningDbEntity, AgentPerformanceTuning>
  implements IAgentTuningRepository
{
  constructor(
    @InjectRepository(AgentTuningDbEntity)
    repository: Repository<AgentTuningDbEntity>
  ) {
    super(repository);
  }

  // findById and findAll now use base class implementations with toDomain mapping

  async findByAgentId(
    agentId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<AgentPerformanceTuning>> {
    const queryBuilder = this.repository
      .createQueryBuilder('tuning')
      .where('tuning.agent_id = :agentId', { agentId });

    return this.paginate(queryBuilder, params);
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

    return this.paginate(queryBuilder, params);
  }

  // save now uses base class implementation with toDatabase/toDomain mapping

  protected override toDomain(entity: AgentTuningDbEntity): AgentPerformanceTuning {
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

  protected override toDatabase(tuning: AgentPerformanceTuning): Partial<AgentTuningDbEntity> {
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
