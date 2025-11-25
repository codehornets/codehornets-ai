import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  color?: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'archived'],
    default: 'active',
  })
  status: 'active' | 'inactive' | 'archived';

  @Column('simple-array', { nullable: true })
  team_members?: string[];

  @Column('jsonb', { nullable: true })
  settings?: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
