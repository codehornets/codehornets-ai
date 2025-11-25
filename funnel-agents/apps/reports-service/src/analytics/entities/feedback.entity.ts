import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('agent_feedback')
@Index(['agentId', 'createdAt'])
@Index(['workspaceId', 'createdAt'])
export class FeedbackEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'agent_id' })
  @Index()
  agentId: string;

  @Column({ name: 'task_id', nullable: true })
  taskId: string;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Column({ type: 'integer', comment: 'Rating from 1-5' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
