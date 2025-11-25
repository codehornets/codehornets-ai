import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('client_feedback')
export class ClientFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspace_id: string;

  @Column({ nullable: true })
  contact_id?: string;

  @Column()
  subject: string;

  @Column('text')
  feedback: string;

  @Column({
    type: 'enum',
    enum: ['positive', 'neutral', 'negative'],
    nullable: true,
  })
  sentiment?: 'positive' | 'neutral' | 'negative';

  @Column({ type: 'int', nullable: true })
  rating?: number;

  @Column({
    type: 'enum',
    enum: ['new', 'in_review', 'addressed', 'closed'],
    default: 'new',
  })
  status: 'new' | 'in_review' | 'addressed' | 'closed';

  @Column('text', { nullable: true })
  response?: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
