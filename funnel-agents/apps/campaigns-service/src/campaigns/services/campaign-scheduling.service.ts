import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom, timeout } from 'rxjs';
import { CampaignScheduleRepository } from '../repositories/campaign-schedule.repository';
import { CampaignRepository } from '../repositories/campaign.repository';
import {
  CampaignScheduleEntity,
  RecurrenceType,
  ScheduleStatus,
} from '../entities/campaign-schedule.entity';
import { CampaignStatus } from '../entities/campaign.entity';
import {
  CreateCampaignScheduleDto,
  UpdateCampaignScheduleDto,
} from '../dto/campaign-schedule.dto';

@Injectable()
export class CampaignSchedulingService {
  private readonly logger = new Logger(CampaignSchedulingService.name);

  constructor(
    private readonly scheduleRepository: CampaignScheduleRepository,
    private readonly campaignRepository: CampaignRepository,
    @Inject('SCHEDULER_SERVICE')
    private readonly schedulerClient: ClientProxy,
  ) {}

  async findByCampaignId(campaignId: string): Promise<CampaignScheduleEntity | null> {
    return this.scheduleRepository.findByCampaignId(campaignId);
  }

  async create(data: CreateCampaignScheduleDto): Promise<CampaignScheduleEntity> {
    // Verify campaign exists
    const campaign = await this.campaignRepository.findById(data.campaign_id);
    if (!campaign) {
      throw new NotFoundException(`Campaign ${data.campaign_id} not found`);
    }

    // Check if schedule already exists
    const existing = await this.scheduleRepository.findByCampaignId(
      data.campaign_id,
    );
    if (existing) {
      throw new Error(`Schedule already exists for campaign ${data.campaign_id}`);
    }

    const startDate = new Date(data.start_date);
    const endDate = data.end_date ? new Date(data.end_date) : undefined;

    const schedule: any = {
      campaign_id: data.campaign_id,
      start_date: startDate,
      end_date: endDate,
      recurrence: data.recurrence || RecurrenceType.NONE,
      cron_expression: data.cron_expression,
      recurrence_config: data.recurrence_config,
      status: ScheduleStatus.PENDING,
      next_run_at: this.calculateNextRun(startDate, data.recurrence),
      run_count: 0,
      max_runs: data.max_runs,
      timezone: data.timezone || 'UTC',
    };

    const savedSchedule = await this.scheduleRepository.save(schedule);

    // Register with scheduler service
    await this.registerWithScheduler(savedSchedule);

    return savedSchedule;
  }

  async update(
    id: string,
    data: UpdateCampaignScheduleDto,
  ): Promise<CampaignScheduleEntity> {
    const schedule = await this.scheduleRepository.findById(id);
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    if (data.start_date !== undefined) {
      schedule.start_date = new Date(data.start_date);
    }
    if (data.end_date !== undefined) {
      schedule.end_date = data.end_date ? new Date(data.end_date) : undefined;
    }
    if (data.recurrence !== undefined) {
      schedule.recurrence = data.recurrence;
    }
    if (data.cron_expression !== undefined) {
      schedule.cron_expression = data.cron_expression;
    }
    if (data.recurrence_config !== undefined) {
      schedule.recurrence_config = {
        ...schedule.recurrence_config,
        ...data.recurrence_config,
      };
    }
    if (data.status !== undefined) {
      schedule.status = data.status;
    }
    if (data.max_runs !== undefined) {
      schedule.max_runs = data.max_runs;
    }
    if (data.timezone !== undefined) {
      schedule.timezone = data.timezone;
    }

    // Recalculate next run if recurrence changed
    if (data.recurrence !== undefined || data.start_date !== undefined) {
      schedule.next_run_at = this.calculateNextRun(
        schedule.start_date,
        schedule.recurrence,
      );
    }

    return this.scheduleRepository.save(schedule);
  }

  async delete(id: string): Promise<void> {
    const schedule = await this.scheduleRepository.findById(id);
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    // Unregister from scheduler service
    await this.unregisterFromScheduler(schedule);

    await this.scheduleRepository.delete(id);
  }

  async activateSchedule(scheduleId: string): Promise<CampaignScheduleEntity> {
    this.logger.log(`Activating schedule ${scheduleId}`);
    return this.update(scheduleId, { status: ScheduleStatus.ACTIVE });
  }

  async pauseSchedule(scheduleId: string): Promise<CampaignScheduleEntity> {
    this.logger.log(`Pausing schedule ${scheduleId}`);
    return this.update(scheduleId, { status: ScheduleStatus.PAUSED });
  }

  /**
   * Cron job to check and execute due schedules
   * Runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processDueSchedules(): Promise<void> {
    this.logger.log('Processing due campaign schedules');

    try {
      const dueSchedules = await this.scheduleRepository.findDueSchedules();

      for (const schedule of dueSchedules) {
        await this.executeSchedule(schedule);
      }

      this.logger.log(`Processed ${dueSchedules.length} due schedules`);
    } catch (error) {
      this.logger.error('Error processing due schedules', error);
    }
  }

  private async executeSchedule(schedule: CampaignScheduleEntity): Promise<void> {
    try {
      this.logger.log(`Executing schedule ${schedule.id} for campaign ${schedule.campaign_id}`);

      // Get campaign
      const campaign = await this.campaignRepository.findById(
        schedule.campaign_id,
      );
      if (!campaign) {
        this.logger.warn(`Campaign ${schedule.campaign_id} not found`);
        return;
      }

      // Update campaign status to active
      if (campaign.status !== CampaignStatus.ACTIVE) {
        campaign.status = CampaignStatus.ACTIVE;
        await this.campaignRepository.save(campaign);
      }

      // Calculate next run
      const nextRun = this.calculateNextRun(
        new Date(),
        schedule.recurrence,
        schedule.cron_expression,
        schedule.recurrence_config,
      );

      // Check if schedule should be completed
      const shouldComplete =
        !nextRun ||
        (schedule.max_runs && schedule.run_count + 1 >= schedule.max_runs) ||
        (schedule.end_date && nextRun > schedule.end_date);

      if (shouldComplete) {
        await this.scheduleRepository.markCompleted(schedule.id);
        this.logger.log(`Schedule ${schedule.id} completed`);
      } else {
        await this.scheduleRepository.updateRunInfo(schedule.id, nextRun);
      }

      this.logger.log(`Schedule ${schedule.id} executed successfully`);
    } catch (error) {
      this.logger.error(
        `Error executing schedule ${schedule.id}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  private calculateNextRun(
    baseDate: Date,
    recurrence?: RecurrenceType,
    cronExpression?: string,
    config?: Record<string, any>,
  ): Date | undefined {
    if (!recurrence || recurrence === RecurrenceType.NONE) {
      return baseDate;
    }

    const next = new Date(baseDate);

    switch (recurrence) {
      case RecurrenceType.DAILY:
        next.setDate(next.getDate() + 1);
        break;
      case RecurrenceType.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case RecurrenceType.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      case RecurrenceType.CUSTOM:
        if (cronExpression) {
          // For now, return next day. In production, use a cron parser library
          next.setDate(next.getDate() + 1);
        }
        break;
    }

    return next;
  }

  private async registerWithScheduler(
    schedule: CampaignScheduleEntity,
  ): Promise<void> {
    try {
      const payload = {
        target_type: 'campaign',
        target_id: schedule.campaign_id,
        schedule_type: schedule.recurrence,
        cron_expression: schedule.cron_expression,
        start_date: schedule.start_date,
        end_date: schedule.end_date,
      };

      await firstValueFrom(
        this.schedulerClient
          .send('scheduler.register', payload)
          .pipe(timeout(5000)),
      );

      this.logger.log(`Registered schedule ${schedule.id} with scheduler service`);
    } catch (error) {
      this.logger.warn(
        `Failed to register with scheduler service: ${error instanceof Error ? error.message : error}`,
      );
      // Don't throw - schedule will still work via cron job
    }
  }

  private async unregisterFromScheduler(
    schedule: CampaignScheduleEntity,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.schedulerClient
          .send('scheduler.unregister', { schedule_id: schedule.id })
          .pipe(timeout(5000)),
      );

      this.logger.log(`Unregistered schedule ${schedule.id} from scheduler service`);
    } catch (error) {
      this.logger.warn(
        `Failed to unregister from scheduler service: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
