import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import {
  ContentAnalytics,
  AnalyticsEventType,
} from '../entities/content-analytics.entity';
import { Content } from '../entities/content.entity';
import {
  TrackAnalyticsDto,
  QueryAnalyticsDto,
  ContentPerformanceDto,
} from '../dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(ContentAnalytics)
    private readonly analyticsRepository: Repository<ContentAnalytics>,
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
  ) {}

  async trackEvent(dto: TrackAnalyticsDto): Promise<ContentAnalytics> {
    // Verify content exists
    const content = await this.contentRepository.findOne({
      where: { id: dto.content_id },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${dto.content_id} not found`);
    }

    const analytics = this.analyticsRepository.create({
      content_id: dto.content_id,
      event_type: dto.event_type,
      channel: dto.channel,
      count: dto.count || 1,
      metadata: dto.metadata,
    });

    return this.analyticsRepository.save(analytics);
  }

  async getAnalytics(query: QueryAnalyticsDto): Promise<ContentAnalytics[]> {
    const queryBuilder =
      this.analyticsRepository.createQueryBuilder('analytics');

    if (query.content_id) {
      queryBuilder.andWhere('analytics.content_id = :content_id', {
        content_id: query.content_id,
      });
    }

    if (query.event_type) {
      queryBuilder.andWhere('analytics.event_type = :event_type', {
        event_type: query.event_type,
      });
    }

    if (query.channel) {
      queryBuilder.andWhere('analytics.channel = :channel', {
        channel: query.channel,
      });
    }

    if (query.start_date) {
      queryBuilder.andWhere('analytics.created_at >= :start_date', {
        start_date: new Date(query.start_date),
      });
    }

    if (query.end_date) {
      queryBuilder.andWhere('analytics.created_at <= :end_date', {
        end_date: new Date(query.end_date),
      });
    }

    queryBuilder.orderBy('analytics.created_at', 'DESC');

    return queryBuilder.getMany();
  }

  async getContentMetrics(contentId: string): Promise<{
    views: number;
    clicks: number;
    shares: number;
    likes: number;
    comments: number;
    conversions: number;
    total_engagement: number;
    engagement_rate: number;
  }> {
    const analytics = await this.analyticsRepository.find({
      where: { content_id: contentId },
    });

    const views =
      analytics
        .filter((a) => a.event_type === AnalyticsEventType.VIEW)
        .reduce((sum, a) => sum + a.count, 0) || 0;

    const clicks =
      analytics
        .filter((a) => a.event_type === AnalyticsEventType.CLICK)
        .reduce((sum, a) => sum + a.count, 0) || 0;

    const shares =
      analytics
        .filter((a) => a.event_type === AnalyticsEventType.SHARE)
        .reduce((sum, a) => sum + a.count, 0) || 0;

    const likes =
      analytics
        .filter((a) => a.event_type === AnalyticsEventType.LIKE)
        .reduce((sum, a) => sum + a.count, 0) || 0;

    const comments =
      analytics
        .filter((a) => a.event_type === AnalyticsEventType.COMMENT)
        .reduce((sum, a) => sum + a.count, 0) || 0;

    const conversions =
      analytics
        .filter((a) => a.event_type === AnalyticsEventType.CONVERSION)
        .reduce((sum, a) => sum + a.count, 0) || 0;

    const totalEngagement = clicks + shares + likes + comments + conversions;
    const engagementRate = views > 0 ? (totalEngagement / views) * 100 : 0;

    return {
      views,
      clicks,
      shares,
      likes,
      comments,
      conversions,
      total_engagement: totalEngagement,
      engagement_rate: parseFloat(engagementRate.toFixed(2)),
    };
  }

  async getPerformanceByChannel(
    dto: ContentPerformanceDto,
  ): Promise<
    Array<{
      channel: string;
      views: number;
      clicks: number;
      shares: number;
      likes: number;
      comments: number;
      conversions: number;
      engagement_rate: number;
    }>
  > {
    const queryBuilder =
      this.analyticsRepository.createQueryBuilder('analytics');

    if (dto.start_date) {
      queryBuilder.andWhere('analytics.created_at >= :start_date', {
        start_date: new Date(dto.start_date),
      });
    }

    if (dto.end_date) {
      queryBuilder.andWhere('analytics.created_at <= :end_date', {
        end_date: new Date(dto.end_date),
      });
    }

    if (dto.channel) {
      queryBuilder.andWhere('analytics.channel = :channel', {
        channel: dto.channel,
      });
    }

    queryBuilder.andWhere('analytics.channel IS NOT NULL');

    const analytics = await queryBuilder.getMany();

    // Group by channel
    const channelMap = new Map<string, ContentAnalytics[]>();

    for (const analytic of analytics) {
      if (!analytic.channel) continue;

      if (!channelMap.has(analytic.channel)) {
        channelMap.set(analytic.channel, []);
      }
      channelMap.get(analytic.channel)!.push(analytic);
    }

    // Calculate metrics per channel
    const results = Array.from(channelMap.entries()).map(
      ([channel, channelAnalytics]) => {
        const views =
          channelAnalytics
            .filter((a) => a.event_type === AnalyticsEventType.VIEW)
            .reduce((sum, a) => sum + a.count, 0) || 0;

        const clicks =
          channelAnalytics
            .filter((a) => a.event_type === AnalyticsEventType.CLICK)
            .reduce((sum, a) => sum + a.count, 0) || 0;

        const shares =
          channelAnalytics
            .filter((a) => a.event_type === AnalyticsEventType.SHARE)
            .reduce((sum, a) => sum + a.count, 0) || 0;

        const likes =
          channelAnalytics
            .filter((a) => a.event_type === AnalyticsEventType.LIKE)
            .reduce((sum, a) => sum + a.count, 0) || 0;

        const comments =
          channelAnalytics
            .filter((a) => a.event_type === AnalyticsEventType.COMMENT)
            .reduce((sum, a) => sum + a.count, 0) || 0;

        const conversions =
          channelAnalytics
            .filter((a) => a.event_type === AnalyticsEventType.CONVERSION)
            .reduce((sum, a) => sum + a.count, 0) || 0;

        const totalEngagement =
          clicks + shares + likes + comments + conversions;
        const engagementRate =
          views > 0 ? (totalEngagement / views) * 100 : 0;

        return {
          channel,
          views,
          clicks,
          shares,
          likes,
          comments,
          conversions,
          engagement_rate: parseFloat(engagementRate.toFixed(2)),
        };
      },
    );

    // Sort by views descending
    results.sort((a, b) => b.views - a.views);

    return results;
  }

  async getTopPerformingContent(
    dto: ContentPerformanceDto,
  ): Promise<
    Array<{
      content_id: string;
      content: Content;
      metrics: {
        views: number;
        clicks: number;
        shares: number;
        likes: number;
        comments: number;
        conversions: number;
        engagement_rate: number;
      };
    }>
  > {
    const queryBuilder =
      this.analyticsRepository.createQueryBuilder('analytics');

    if (dto.start_date) {
      queryBuilder.andWhere('analytics.created_at >= :start_date', {
        start_date: new Date(dto.start_date),
      });
    }

    if (dto.end_date) {
      queryBuilder.andWhere('analytics.created_at <= :end_date', {
        end_date: new Date(dto.end_date),
      });
    }

    if (dto.channel) {
      queryBuilder.andWhere('analytics.channel = :channel', {
        channel: dto.channel,
      });
    }

    const analytics = await queryBuilder.getMany();

    // Group by content_id
    const contentMap = new Map<string, ContentAnalytics[]>();

    for (const analytic of analytics) {
      if (!contentMap.has(analytic.content_id)) {
        contentMap.set(analytic.content_id, []);
      }
      contentMap.get(analytic.content_id)!.push(analytic);
    }

    // Calculate metrics per content
    const results = await Promise.all(
      Array.from(contentMap.entries()).map(
        async ([contentId, contentAnalytics]) => {
          const content = await this.contentRepository.findOne({
            where: { id: contentId },
          });

          if (!content) return null;

          const views =
            contentAnalytics
              .filter((a) => a.event_type === AnalyticsEventType.VIEW)
              .reduce((sum, a) => sum + a.count, 0) || 0;

          const clicks =
            contentAnalytics
              .filter((a) => a.event_type === AnalyticsEventType.CLICK)
              .reduce((sum, a) => sum + a.count, 0) || 0;

          const shares =
            contentAnalytics
              .filter((a) => a.event_type === AnalyticsEventType.SHARE)
              .reduce((sum, a) => sum + a.count, 0) || 0;

          const likes =
            contentAnalytics
              .filter((a) => a.event_type === AnalyticsEventType.LIKE)
              .reduce((sum, a) => sum + a.count, 0) || 0;

          const comments =
            contentAnalytics
              .filter((a) => a.event_type === AnalyticsEventType.COMMENT)
              .reduce((sum, a) => sum + a.count, 0) || 0;

          const conversions =
            contentAnalytics
              .filter((a) => a.event_type === AnalyticsEventType.CONVERSION)
              .reduce((sum, a) => sum + a.count, 0) || 0;

          const totalEngagement =
            clicks + shares + likes + comments + conversions;
          const engagementRate =
            views > 0 ? (totalEngagement / views) * 100 : 0;

          return {
            content_id: contentId,
            content,
            metrics: {
              views,
              clicks,
              shares,
              likes,
              comments,
              conversions,
              engagement_rate: parseFloat(engagementRate.toFixed(2)),
            },
          };
        },
      ),
    );

    // Filter out nulls and sort by engagement rate
    const filtered = results.filter((r) => r !== null) as Array<{
      content_id: string;
      content: Content;
      metrics: any;
    }>;

    filtered.sort(
      (a, b) => b.metrics.engagement_rate - a.metrics.engagement_rate,
    );

    // Return top N
    return filtered.slice(0, dto.limit || 10);
  }
}
