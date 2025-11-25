import { Injectable } from '@nestjs/common';
import {
  AgentFeedback,
  IAgentFeedbackRepository,
  AgentFeedbackFilters,
  FeedbackType,
} from '@funnelagents/domain';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';

@Injectable()
export class AgentFeedbackService {
  constructor(private readonly feedbackRepository: IAgentFeedbackRepository) {}

  async findById(id: string): Promise<AgentFeedback | null> {
    return this.feedbackRepository.findById(id);
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<AgentFeedback>> {
    return this.feedbackRepository.findAll(params);
  }

  async findByAgentId(
    agentId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<AgentFeedback>> {
    return this.feedbackRepository.findByAgentId(agentId, params);
  }

  async findWithFilters(
    filters: AgentFeedbackFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<AgentFeedback>> {
    return this.feedbackRepository.findWithFilters(filters, params);
  }

  async create(data: {
    agentId: string;
    taskId?: string;
    rating: number;
    comment?: string;
    feedbackType: FeedbackType;
    createdBy?: string;
  }): Promise<AgentFeedback> {
    const feedback = AgentFeedback.create({
      agentId: data.agentId,
      taskId: data.taskId,
      rating: data.rating,
      comment: data.comment,
      feedbackType: data.feedbackType,
      createdBy: data.createdBy,
    });

    return this.feedbackRepository.save(feedback);
  }

  async update(
    id: string,
    updates: {
      rating?: number;
      comment?: string;
    }
  ): Promise<AgentFeedback> {
    const feedback = await this.feedbackRepository.findById(id);
    if (!feedback) {
      throw new Error(`Feedback with id ${id} not found`);
    }

    if (updates.rating !== undefined) {
      feedback.updateRating(updates.rating);
    }

    if (updates.comment !== undefined) {
      feedback.updateComment(updates.comment);
    }

    return this.feedbackRepository.save(feedback);
  }

  async delete(id: string): Promise<void> {
    const exists = await this.feedbackRepository.exists(id);
    if (!exists) {
      throw new Error(`Feedback with id ${id} not found`);
    }

    return this.feedbackRepository.delete(id);
  }
}
