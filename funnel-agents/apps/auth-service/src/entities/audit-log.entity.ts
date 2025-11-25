import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_COMPLETE = 'password_reset_complete',
  PROFILE_UPDATE = 'profile_update',
  TOKEN_REFRESH = 'token_refresh',
  FAILED_LOGIN = 'failed_login',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  user_id?: string;

  @Column()
  email: string;

  @Column({
    type: 'varchar',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({ name: 'ip_address', nullable: true })
  ip_address?: string;

  @Column({ name: 'user_agent', nullable: true, type: 'text' })
  user_agent?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ default: true })
  success: boolean;

  @Column({ name: 'error_message', nullable: true, type: 'text' })
  error_message?: string;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  created_at: Date;
}
