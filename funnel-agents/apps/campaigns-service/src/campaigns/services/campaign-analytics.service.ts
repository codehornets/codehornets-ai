import { Injectable, Logger } from '@nestjs/common';
import { CampaignAnalyticsRepository } from '../repositories/campaign-analytics.repository';
import { CampaignRepository } from '../repositories/campaign.repository';
import { CampaignAnalyticsEntity, AnalyticEventType } from '../entities/campaign-analytics.entity';
import {
  CreateAnalyticEventDto,
  CampaignPerformanceDto,
} from '../dto/campaign-analytics.dto';

@Injectable()
export class CampaignAnalyticsService {
  private readonly logger = new Logger(CampaignAnalyticsService.name);

  constructor(
    private readonly analyticsRepository: CampaignAnalyticsRepository,
    private readonly campaignRepository: CampaignRepository,
  ) {}

  async trackEvent(data: CreateAnalyticEventDto): Promise<CampaignAnalyticsEntity> {
    this.logger.log(
      `Tracking event: ${data.event_type} for campaign ${data.campaign_id}`,
    );

    const event: any = {
      campaign_id: data.campaign_id,
      event_type: data.event_type,
      metadata: data.metadata,
      entity_id: data.entity_id,
      entity_type: data.entity_type,
      workspace_id: data.workspace_id,
      event_timestamp: data.event_timestamp
        ? new Date(data.event_timestamp)
        : new Date(),
    };

    return this.analyticsRepository.save(event);
  }

  async getCampaignPerformance(
    campaignId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CampaignPerformanceDto> {
    this.logger.log(`Generating performance report for campaign ${campaignId}`);

    const campaign = await this.campaignRepository.findById(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    // Get event counts
    const [
      totalLeads,
      convertedLeads,
      emailsSent,
      emailsOpened,
      emailsClicked,
      tasksCompleted,
      agentExecutions,
    ] = await Promise.all([
      this.analyticsRepository.countByEventType(
        campaignId,
        AnalyticEventType.LEAD_CREATED,
        startDate,
        endDate,
      ),
      this.analyticsRepository.countByEventType(
        campaignId,
        AnalyticEventType.LEAD_CONVERTED,
        startDate,
        endDate,
      ),
      this.analyticsRepository.countByEventType(
        campaignId,
        AnalyticEventType.EMAIL_SENT,
        startDate,
        endDate,
      ),
      this.analyticsRepository.countByEventType(
        campaignId,
        AnalyticEventType.EMAIL_OPENED,
        startDate,
        endDate,
      ),
      this.analyticsRepository.countByEventType(
        campaignId,
        AnalyticEventType.EMAIL_CLICKED,
        startDate,
        endDate,
      ),
      this.analyticsRepository.countByEventType(
        campaignId,
        AnalyticEventType.TASK_COMPLETED,
        startDate,
        endDate,
      ),
      this.analyticsRepository.countByEventType(
        campaignId,
        AnalyticEventType.AGENT_EXECUTED,
        startDate,
        endDate,
      ),
    ]);

    // Calculate rates
    const conversionRate =
      totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const openRate = emailsSent > 0 ? (emailsOpened / emailsSent) * 100 : 0;
    const clickRate = emailsSent > 0 ? (emailsClicked / emailsSent) * 100 : 0;

    // Get daily metrics
    const eventsByDay = await this.analyticsRepository.getEventsByDay(
      campaignId,
      startDate,
      endDate,
    );

    const dailyMetrics = this.aggregateDailyMetrics(eventsByDay);

    // Get agent performance
    const agentPerformance = await this.getAgentPerformance(
      campaignId,
      startDate,
      endDate,
    );

    return {
      campaign_id: campaignId,
      campaign_name: campaign.name,
      total_leads: totalLeads,
      converted_leads: convertedLeads,
      conversion_rate: Number(conversionRate.toFixed(2)),
      emails_sent: emailsSent,
      emails_opened: emailsOpened,
      open_rate: Number(openRate.toFixed(2)),
      emails_clicked: emailsClicked,
      click_rate: Number(clickRate.toFixed(2)),
      tasks_completed: tasksCompleted,
      agent_executions: agentExecutions,
      agent_performance: agentPerformance,
      daily_metrics: dailyMetrics,
    };
  }

  private aggregateDailyMetrics(
    eventsByDay: Array<{ date: string; event_type: string; count: number }>,
  ): Array<{
    date: string;
    leads: number;
    conversions: number;
    emails_sent: number;
    emails_opened: number;
  }> {
    const metricsMap = new Map<
      string,
      {
        date: string;
        leads: number;
        conversions: number;
        emails_sent: number;
        emails_opened: number;
      }
    >();

    for (const event of eventsByDay) {
      const existing = metricsMap.get(event.date) || {
        date: event.date,
        leads: 0,
        conversions: 0,
        emails_sent: 0,
        emails_opened: 0,
      };

      switch (event.event_type) {
        case AnalyticEventType.LEAD_CREATED:
          existing.leads += Number(event.count);
          break;
        case AnalyticEventType.LEAD_CONVERTED:
          existing.conversions += Number(event.count);
          break;
        case AnalyticEventType.EMAIL_SENT:
          existing.emails_sent += Number(event.count);
          break;
        case AnalyticEventType.EMAIL_OPENED:
          existing.emails_opened += Number(event.count);
          break;
      }

      metricsMap.set(event.date, existing);
    }

    return Array.from(metricsMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  private async getAgentPerformance(
    campaignId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Record<string, any>> {
    const filters: any = {
      campaign_id: campaignId,
      event_type: AnalyticEventType.AGENT_EXECUTED,
      entity_type: 'agent',
    };

    if (startDate) filters.start_date = startDate;
    if (endDate) filters.end_date = endDate;

    const events = await this.analyticsRepository.findWithFilters(filters);

    const agentMap = new Map<string, { executions: number; success: number }>();

    for (const event of events.data) {
      if (!event.entity_id) continue;

      const existing = agentMap.get(event.entity_id) || {
        executions: 0,
        success: 0,
      };

      existing.executions++;
      if (event.metadata?.success === true) {
        existing.success++;
      }

      agentMap.set(event.entity_id, existing);
    }

    const result: Record<string, any> = {};
    for (const [agentId, stats] of agentMap.entries()) {
      result[agentId] = {
        executions: stats.executions,
        success: stats.success,
        success_rate:
          stats.executions > 0
            ? Number(((stats.success / stats.executions) * 100).toFixed(2))
            : 0,
      };
    }

    return result;
  }
}
