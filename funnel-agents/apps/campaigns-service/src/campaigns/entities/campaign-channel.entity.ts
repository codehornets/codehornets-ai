import { Entity, Column, Index } from 'typeorm';
import { BaseDbEntity } from '@funnelagents/infrastructure';

export enum ChannelType {
  EMAIL = 'email',
  SMS = 'sms',
  SOCIAL_MEDIA = 'social_media',
  WEBHOOK = 'webhook',
  PUSH_NOTIFICATION = 'push_notification',
}

export enum ChannelStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('campaign_channels')
@Index(['campaign_id'])
@Index(['channel_type'])
@Index(['status'])
export class CampaignChannelEntity extends BaseDbEntity {
  @Column({ name: 'campaign_id' })
  @Index()
  campaign_id: string;

  @Column({
    type: 'enum',
    enum: ChannelType,
    name: 'channel_type',
  })
  channel_type: ChannelType;

  @Column({
    type: 'enum',
    enum: ChannelStatus,
    default: ChannelStatus.DRAFT,
  })
  status: ChannelStatus;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  configuration?: Record<string, any>;

  @Column({ name: 'send_count', type: 'int', default: 0 })
  send_count: number;

  @Column({ name: 'success_count', type: 'int', default: 0 })
  success_count: number;

  @Column({ name: 'failure_count', type: 'int', default: 0 })
  failure_count: number;

  @Column({ name: 'scheduled_at', type: 'timestamp', nullable: true })
  scheduled_at?: Date;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  started_at?: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completed_at?: Date;
}
