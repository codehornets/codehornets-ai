import { Entity, Column, Index } from 'typeorm';
import { BaseDbEntity } from './base.entity';

@Entity('agents')
@Index(['domain', 'status'])
@Index(['type'])
export class AgentDbEntity extends BaseDbEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100, default: 'custom' })
  @Index()
  type: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  domain: string;

  @Column({ type: 'varchar', length: 50, default: 'inactive' })
  @Index()
  status: string;

  @Column({ type: 'simple-array' })
  skills: string[];

  @Column({ type: 'simple-array', nullable: true })
  tools: string[];

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  success_rate?: number;

  @Column({ type: 'int', default: 0 })
  tasks_completed: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  avg_completion_time?: number;

  @Column({ type: 'jsonb', nullable: true })
  settings?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  prompt_template?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model?: string;
}
