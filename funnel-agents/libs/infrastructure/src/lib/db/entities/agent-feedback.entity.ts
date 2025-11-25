import { Entity, Column, Index } from 'typeorm';
import { BaseDbEntity } from './base.entity';

@Entity('agent_feedback')
@Index(['agent_id'])
@Index(['task_id'])
export class AgentFeedbackDbEntity extends BaseDbEntity {
  @Column({ type: 'uuid' })
  @Index()
  agent_id: string;

  @Column({ type: 'uuid', nullable: true })
  task_id?: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  feedback_type: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  created_by?: string;
}
