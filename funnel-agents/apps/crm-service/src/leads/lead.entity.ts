import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('leads')
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

  @Column({ type: 'float', nullable: true })
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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
