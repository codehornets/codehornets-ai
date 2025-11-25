import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tasks')
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  status: string;

  @Column()
  priority: string;

  @Column({ name: 'agent_id', nullable: true })
  agentId: string;

  @Column({ name: 'workspace_id', nullable: true })
  workspaceId: string;

  @Column({ type: 'jsonb', nullable: true })
  input: any;

  @Column({ type: 'jsonb', nullable: true })
  output: any;

  @Column({ name: 'scheduled_at', nullable: true })
  scheduledAt: Date;

  @Column({ name: 'started_at', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  timeout: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
