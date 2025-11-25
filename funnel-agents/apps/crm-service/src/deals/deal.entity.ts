import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('deals')
export class Deal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  workspace_id?: string;

  @Column({ nullable: true })
  contact_id?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  value: number;

  @Column({
    type: 'enum',
    enum: ['discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
    default: 'discovery',
  })
  stage: 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

  @Column({ type: 'timestamp', nullable: true })
  expected_close_date?: Date;

  @Column('text', { nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
