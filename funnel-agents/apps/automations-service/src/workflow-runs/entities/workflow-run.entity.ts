import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workflow } from '../../workflows/entities/workflow.entity';

export type WorkflowRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ExecutionLogEntry {
  node_id: string;
  node_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  started_at?: Date;
  completed_at?: Date;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
}

@Entity('workflow_runs')
export class WorkflowRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  workflow_id!: string;

  @ManyToOne(() => Workflow)
  @JoinColumn({ name: 'workflow_id' })
  workflow?: Workflow;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'pending',
  })
  status!: WorkflowRunStatus;

  @Column({ type: 'varchar', length: 50 })
  trigger_type!: string;

  @Column({ type: 'jsonb', nullable: true })
  trigger_data?: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  current_node_id?: string;

  @Column({ type: 'jsonb', default: [] })
  execution_log!: ExecutionLogEntry[];

  @Column({ type: 'text', nullable: true })
  error_message?: string;

  @Column({ type: 'timestamp', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;
}
