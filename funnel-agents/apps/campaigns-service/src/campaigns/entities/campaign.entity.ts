import { Entity, Column, Index } from 'typeorm';
import { BaseDbEntity } from '@funnelagents/infrastructure';

export enum CampaignStatus {
  DRAFT = 'draft',
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum CampaignPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('campaigns')
@Index(['workspace_id'])
@Index(['status'])
@Index(['priority'])
@Index(['created_at'])
export class CampaignEntity extends BaseDbEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'workspace_id', nullable: true })
  @Index()
  workspace_id?: string;

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  @Column({
    type: 'enum',
    enum: CampaignPriority,
    default: CampaignPriority.MEDIUM,
  })
  priority: CampaignPriority;

  @Column({ type: 'text', nullable: true })
  goal?: string;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  start_date?: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  end_date?: Date;

  @Column({ name: 'team_members', type: 'simple-array', nullable: true })
  team_members?: string[];

  @Column({ name: 'agent_ids', type: 'simple-array', nullable: true })
  agent_ids?: string[];

  @Column({ type: 'jsonb', nullable: true })
  settings?: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  progress?: number;
}
