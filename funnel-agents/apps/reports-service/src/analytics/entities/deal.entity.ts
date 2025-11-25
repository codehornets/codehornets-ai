import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('deals')
@Index(['workspaceId', 'status'])
@Index(['leadId'])
export class DealEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Column({ name: 'lead_id', nullable: true })
  leadId: string;

  @Column({ name: 'agent_id', nullable: true })
  agentId: string;

  @Column()
  title: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ default: 'prospect' })
  status: string;

  @Column({ type: 'integer', default: 0, comment: 'Deal stage from 0-100' })
  stage: number;

  @Column({ name: 'expected_close_date', nullable: true })
  expectedCloseDate: Date;

  @Column({ name: 'closed_at', nullable: true })
  closedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
