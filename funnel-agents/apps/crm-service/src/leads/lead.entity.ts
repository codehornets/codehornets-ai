import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('leads')
@Index(['workspaceId', 'status'])
@Index(['campaignId'])
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  company?: string;

  @Column({ name: 'job_title', nullable: true })
  jobTitle?: string;

  @Column({
    type: 'enum',
    enum: [
      'new',
      'enriched',
      'qualified',
      'contacted',
      'in_conversation',
      'proposal_sent',
      'won',
      'lost',
    ],
    default: 'new',
  })
  status:
    | 'new'
    | 'enriched'
    | 'qualified'
    | 'contacted'
    | 'in_conversation'
    | 'proposal_sent'
    | 'won'
    | 'lost';

  @Column({ type: 'float', nullable: true, default: 0 })
  score?: number;

  @Column('jsonb', { nullable: true })
  score_breakdown?: {
    icp_fit: number;
    engagement: number;
    recency: number;
    confidence: number;
  };

  @Column({ nullable: true })
  source?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('simple-array', { nullable: true })
  tags?: string[];

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'workspace_id', nullable: true })
  workspaceId?: string;

  @Column({ name: 'campaign_id', nullable: true })
  campaignId?: string;

  @Column({ name: 'agent_id', nullable: true })
  agentId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
