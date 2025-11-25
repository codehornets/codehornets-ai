import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('contacts')
export class Contact {
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
    enum: ['lead', 'client', 'partner', 'other'],
    default: 'lead',
  })
  type: 'lead' | 'client' | 'partner' | 'other';

  @Column({ nullable: true })
  workspace_id?: string;

  @Column({ nullable: true })
  linkedin_url?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
