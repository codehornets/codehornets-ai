import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lead } from '@funnelagents/domain';

@Entity('lead_activities')
export class LeadActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  lead_id: string;

  @ManyToOne(() => Lead, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({
    type: 'enum',
    enum: ['call', 'email', 'meeting', 'note', 'ai_action', 'status_change'],
  })
  type: 'call' | 'email' | 'meeting' | 'note' | 'ai_action' | 'status_change';

  @Column('text')
  description: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;
}
