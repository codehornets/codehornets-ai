import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@funnelagents/infrastructure';
import { CampaignScheduleEntity, ScheduleStatus } from '../entities/campaign-schedule.entity';

@Injectable()
export class CampaignScheduleRepository extends BaseRepository<CampaignScheduleEntity> {
  constructor(
    @InjectRepository(CampaignScheduleEntity)
    repository: Repository<CampaignScheduleEntity>,
  ) {
    super(repository);
  }

  async findByCampaignId(campaignId: string): Promise<CampaignScheduleEntity | null> {
    return this.repository.findOne({
      where: { campaign_id: campaignId },
    });
  }

  async findDueSchedules(): Promise<CampaignScheduleEntity[]> {
    return this.repository
      .createQueryBuilder('schedule')
      .where('schedule.status = :status', { status: ScheduleStatus.ACTIVE })
      .andWhere('schedule.next_run_at IS NOT NULL')
      .andWhere('schedule.next_run_at <= :now', { now: new Date() })
      .getMany();
  }

  async updateRunInfo(
    scheduleId: string,
    nextRunAt?: Date,
  ): Promise<void> {
    await this.repository.update(scheduleId, {
      last_run_at: new Date(),
      next_run_at: nextRunAt,
      run_count: () => 'run_count + 1',
    });
  }

  async markCompleted(scheduleId: string): Promise<void> {
    await this.repository.update(scheduleId, {
      status: ScheduleStatus.COMPLETED,
      next_run_at: undefined,
    });
  }
}
