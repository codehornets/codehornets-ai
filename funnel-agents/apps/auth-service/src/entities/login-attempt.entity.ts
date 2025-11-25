import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('login_attempts')
export class LoginAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  email: string;

  @Column({ name: 'ip_address' })
  @Index()
  ip_address: string;

  @Column({ default: false })
  success: boolean;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  created_at: Date;
}
