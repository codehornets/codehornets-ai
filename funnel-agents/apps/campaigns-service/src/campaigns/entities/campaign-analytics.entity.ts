import { Entity, Column, Index } from 'typeorm';
import { BaseDbEntity } from '@funnelagents/infrastructure';

export enum AnalyticEventType {
  EMAIL_SENT = 'email_sent',
  EMAIL_OPENED = 'email_opened',
  EMAIL_CLICKED = 'email_clicked',
  EMAIL_BOUNCED = 'email_bounced',
  LEAD_CREATED = 'lead_created',
  LEAD_CONVERTED = 'lead_converted',
  TASK_COMPLETED = 'task_completed',
  AGENT_EXECUTED = 'agent_executed',
  CAMPAIGN_STARTED = 'campaign_started',
  CAMPAIGN_PAUSED = 'campaign_paused',
  CAMPAIGN_COMPLETED = 'campaign_completed',
}

@Entity('campaign_analytics')
@Index(['campaign_id'])
@Index(['event_type'])
@Index(['created_at'])
@Index(['campaign_id', 'event_type'])
export class CampaignAnalyticsEntity extends BaseDbEntity {
  @Column({ name: 'campaign_id' })
  @Index()
  campaign_id: string;

  @Column({
    type: 'enum',
    enum: AnalyticEventType,
    name: 'event_type',
  })
  event_type: AnalyticEventType;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'entity_id', nullable: true })
  entity_id?: string; // Lead ID, Task ID, Agent ID, etc.

  @Column({ name: 'entity_type', nullable: true })
  entity_type?: string; // 'lead', 'task', 'agent', etc.

  @Column({ name: 'workspace_id', nullable: true })
  workspace_id?: string;

  @Column({ type: 'timestamp', name: 'event_timestamp', default: () => 'CURRENT_TIMESTAMP' })
  event_timestamp: Date;
}
