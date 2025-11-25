import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('leads')
@Index(['workspaceId', 'status'])
@Index(['campaignId'])
export class LeadEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Column({ name: 'campaign_id', nullable: true })
  campaignId: string;

  @Column({ name: 'agent_id', nullable: true })
  agentId: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  company: string;

  @Column({ default: 'new' })
  status: string;

  @Column({ nullable: true })
  source: string;

  @Column({ type: 'integer', default: 0 })
  score: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
