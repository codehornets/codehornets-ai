import { Entity, Column, Index } from 'typeorm';
import { BaseDbEntity } from '@funnelagents/infrastructure';

export enum RecurrenceType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom', // Using cron expression
}

export enum ScheduleStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('campaign_schedules')
@Index(['campaign_id'])
@Index(['status'])
@Index(['next_run_at'])
export class CampaignScheduleEntity extends BaseDbEntity {
  @Column({ name: 'campaign_id', unique: true })
  @Index()
  campaign_id: string;

  @Column({ type: 'timestamp', name: 'start_date' })
  start_date: Date;

  @Column({ type: 'timestamp', name: 'end_date', nullable: true })
  end_date?: Date;

  @Column({
    type: 'enum',
    enum: RecurrenceType,
    default: RecurrenceType.NONE,
  })
  recurrence: RecurrenceType;

  @Column({ name: 'cron_expression', nullable: true })
  cron_expression?: string; // For custom recurrence

  @Column({ type: 'jsonb', nullable: true })
  recurrence_config?: Record<string, any>; // Days of week, days of month, etc.

  @Column({
    type: 'enum',
    enum: ScheduleStatus,
    default: ScheduleStatus.PENDING,
  })
  status: ScheduleStatus;

  @Column({ type: 'timestamp', name: 'next_run_at', nullable: true })
  @Index()
  next_run_at?: Date;

  @Column({ type: 'timestamp', name: 'last_run_at', nullable: true })
  last_run_at?: Date;

  @Column({ name: 'run_count', type: 'int', default: 0 })
  run_count: number;

  @Column({ name: 'max_runs', type: 'int', nullable: true })
  max_runs?: number; // Null = unlimited

  @Column({ name: 'timezone', default: 'UTC' })
  timezone: string;
}
