import { Entity, Column, Index } from 'typeorm';
import { BaseDbEntity } from './base.entity';

@Entity('agent_performance_tuning')
@Index(['agent_id'])
@Index(['tuning_type'])
export class AgentTuningDbEntity extends BaseDbEntity {
  @Column({ type: 'uuid' })
  @Index()
  agent_id: string;

  @Column({ type: 'varchar', length: 50 })
  tuning_type: string;

  @Column({ type: 'jsonb', nullable: true })
  before_value?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  after_value?: Record<string, any>;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  performance_delta?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamp', nullable: true })
  applied_at?: Date;
}
