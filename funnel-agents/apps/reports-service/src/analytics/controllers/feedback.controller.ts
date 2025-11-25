import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedbackEntity } from '../entities/feedback.entity';
import { CreateFeedbackDto, FeedbackStatsDto } from '../dto/feedback.dto';

@Controller('feedback')
export class FeedbackController {
  constructor(
    @InjectRepository(FeedbackEntity)
    private readonly feedbackRepository: Repository<FeedbackEntity>,
  ) {}

  @Post()
  @MessagePattern({ cmd: 'create_feedback' })
  async create(@Body() dto: CreateFeedbackDto): Promise<FeedbackEntity> {
    const feedback = this.feedbackRepository.create(dto);
    return this.feedbackRepository.save(feedback);
  }

  @Get('agent/:agentId')
  @MessagePattern({ cmd: 'get_agent_feedback' })
  async getAgentFeedback(@Param('agentId') agentId: string): Promise<FeedbackEntity[]> {
    return this.feedbackRepository.find({
      where: { agentId },
      order: { createdAt: 'DESC' },
    });
  }

  @Get('agent/:agentId/stats')
  @MessagePattern({ cmd: 'get_agent_feedback_stats' })
  async getAgentFeedbackStats(
    @Param('agentId') agentId: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ): Promise<FeedbackStatsDto> {
    const queryBuilder = this.feedbackRepository
      .createQueryBuilder('feedback')
      .where('feedback.agent_id = :agentId', { agentId });

    if (startDate) {
      queryBuilder.andWhere('feedback.created_at >= :startDate', {
        startDate: new Date(startDate),
      });
    }

    if (endDate) {
      queryBuilder.andWhere('feedback.created_at <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    const feedbacks = await queryBuilder.getMany();

    // Calculate stats
    const totalFeedback = feedbacks.length;
    const averageRating =
      totalFeedback > 0
        ? feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / totalFeedback
        : 0;

    // Rating distribution
    const ratingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    feedbacks.forEach((fb) => {
      ratingDistribution[fb.rating] = (ratingDistribution[fb.rating] || 0) + 1;
    });

    // Trend analysis (group by day)
    const trendMap = new Map<string, { sum: number; count: number }>();

    feedbacks.forEach((fb) => {
      const date = fb.createdAt.toISOString().split('T')[0];
      const existing = trendMap.get(date) || { sum: 0, count: 0 };
      existing.sum += fb.rating;
      existing.count += 1;
      trendMap.set(date, existing);
    });

    const trend = Array.from(trendMap.entries())
      .map(([date, { sum, count }]) => ({
        date,
        averageRating: Number((sum / count).toFixed(2)),
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      agentId,
      totalFeedback,
      averageRating: Number(averageRating.toFixed(2)),
      ratingDistribution,
      trend,
    };
  }

  @Get('workspace/:workspaceId/stats')
  @MessagePattern({ cmd: 'get_workspace_feedback_stats' })
  async getWorkspaceFeedbackStats(
    @Param('workspaceId') workspaceId: string,
  ): Promise<{ averageRating: number; totalFeedback: number }> {
    const feedbacks = await this.feedbackRepository.find({
      where: { workspaceId },
    });

    const totalFeedback = feedbacks.length;
    const averageRating =
      totalFeedback > 0
        ? feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / totalFeedback
        : 0;

    return {
      totalFeedback,
      averageRating: Number(averageRating.toFixed(2)),
    };
  }
}
