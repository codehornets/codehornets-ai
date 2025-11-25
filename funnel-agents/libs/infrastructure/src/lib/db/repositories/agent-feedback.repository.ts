import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IAgentFeedbackRepository,
  AgentFeedback,
  AgentFeedbackFilters,
  PaginationParams,
  PaginatedResult,
  UniqueId,
  FeedbackType,
} from '@funnelagents/domain';
import { AgentFeedbackDbEntity } from '../entities/agent-feedback.entity';
import { BaseRepository } from '../base.repository';

@Injectable()
export class AgentFeedbackRepository
  extends BaseRepository<AgentFeedbackDbEntity>
  implements IAgentFeedbackRepository
{
  constructor(
    @InjectRepository(AgentFeedbackDbEntity)
    repository: Repository<AgentFeedbackDbEntity>
  ) {
    super(repository);
  }

  async findById(id: string): Promise<AgentFeedback | null> {
    const entity = await super.findById(id);
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<AgentFeedback>> {
    const result = await super.findAll(params);
    return {
      data: result.data.map((e) => this.toDomain(e)),
      meta: result.meta,
    };
  }

  async findByAgentId(
    agentId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<AgentFeedback>> {
    const queryBuilder = this.repository
      .createQueryBuilder('feedback')
      .where('feedback.agent_id = :agentId', { agentId });

    const result = await this.paginate(queryBuilder, params);
    return {
      data: result.data.map((e) => this.toDomain(e)),
      meta: result.meta,
    };
  }

  async findWithFilters(
    filters: AgentFeedbackFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<AgentFeedback>> {
    const queryBuilder = this.repository.createQueryBuilder('feedback');

    if (filters.agentId) {
      queryBuilder.andWhere('feedback.agent_id = :agentId', { agentId: filters.agentId });
    }

    if (filters.taskId) {
      queryBuilder.andWhere('feedback.task_id = :taskId', { taskId: filters.taskId });
    }

    if (filters.feedbackType) {
      queryBuilder.andWhere('feedback.feedback_type = :feedbackType', {
        feedbackType: filters.feedbackType,
      });
    }

    if (filters.minRating !== undefined) {
      queryBuilder.andWhere('feedback.rating >= :minRating', { minRating: filters.minRating });
    }

    if (filters.maxRating !== undefined) {
      queryBuilder.andWhere('feedback.rating <= :maxRating', { maxRating: filters.maxRating });
    }

    const result = await this.paginate(queryBuilder, params);
    return {
      data: result.data.map((e) => this.toDomain(e)),
      meta: result.meta,
    };
  }

  async save(feedback: AgentFeedback): Promise<AgentFeedback> {
    const entity = this.toDatabase(feedback);
    const saved = await super.save(entity);
    return this.toDomain(saved);
  }

  private toDomain(entity: AgentFeedbackDbEntity): AgentFeedback {
    return AgentFeedback.reconstitute(
      {
        agentId: entity.agent_id,
        taskId: entity.task_id,
        rating: entity.rating,
        comment: entity.comment,
        feedbackType: entity.feedback_type as FeedbackType,
        createdBy: entity.created_by,
      },
      UniqueId.fromString(entity.id)
    );
  }

  private toDatabase(feedback: AgentFeedback): Partial<AgentFeedbackDbEntity> {
    return {
      id: feedback.id.value,
      agent_id: feedback.agentId,
      task_id: feedback.taskId,
      rating: feedback.rating,
      comment: feedback.comment,
      feedback_type: feedback.feedbackType,
      created_by: feedback.createdBy,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
    };
  }
}
