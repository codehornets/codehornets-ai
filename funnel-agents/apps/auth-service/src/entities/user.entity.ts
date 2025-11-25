import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({
    type: 'varchar',
    default: 'user',
  })
  role: 'admin' | 'user' | 'viewer';

  @Column({ name: 'onboarding_completed', default: false })
  onboarding_completed: boolean;

  @Column({ name: 'company_name', nullable: true })
  company_name?: string;

  @Column({ name: 'team_size', nullable: true })
  team_size?: string;

  @Column({ name: 'industry', nullable: true })
  industry?: string;

  @Column({ name: 'failed_login_attempts', default: 0 })
  failed_login_attempts: number;

  @Column({ name: 'locked_until', nullable: true })
  locked_until?: Date;

  @Column({ name: 'last_login', nullable: true })
  last_login?: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
