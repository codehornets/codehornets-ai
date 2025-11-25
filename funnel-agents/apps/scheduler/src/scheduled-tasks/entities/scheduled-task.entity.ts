import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TaskType {
  WORKFLOW = 'workflow',
  REPORT = 'report',
  AGENT = 'agent',
  CUSTOM = 'custom',
}

export enum TaskStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  FAILED = 'failed',
  COMPLETED = 'completed',
}

@Entity('scheduled_tasks')
@Index(['enabled', 'next_run_at'])
@Index(['task_type', 'enabled'])
export class ScheduledTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100 })
  cron_expression: string;

  @Column({ type: 'enum', enum: TaskType })
  task_type: TaskType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  target_id?: string;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.ACTIVE })
  status: TaskStatus;

  @Column({ type: 'timestamp', nullable: true })
  last_run_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  next_run_at?: Date;

  @Column({ type: 'int', default: 0 })
  run_count: number;

  @Column({ type: 'int', default: 0 })
  failure_count: number;

  @Column({ type: 'text', nullable: true })
  last_error?: string;

  @Column({ type: 'jsonb', nullable: true })
  config?: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  created_by?: string;

  @Column({ type: 'int', default: 3 })
  max_retries: number;

  @Column({ type: 'int', default: 300 })
  timeout_seconds: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
