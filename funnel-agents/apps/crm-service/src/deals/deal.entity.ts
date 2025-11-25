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

  @Column({ name: 'workspace_id', nullable: true })
  workspaceId?: string;

  @Column({ name: 'contact_id', nullable: true })
  contactId?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  value: number;

  @Column({
    type: 'enum',
    enum: ['discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
    default: 'discovery',
  })
  stage: 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

  @Column({ name: 'expected_close_date', type: 'timestamp', nullable: true })
  expectedCloseDate?: Date;

  @Column('text', { nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
