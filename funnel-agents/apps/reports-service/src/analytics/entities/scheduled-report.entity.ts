import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ReportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json',
}

export enum ReportType {
  TASK_ANALYTICS = 'task_analytics',
  AGENT_ANALYTICS = 'agent_analytics',
  DOMAIN_ANALYTICS = 'domain_analytics',
  CUSTOM = 'custom',
  TEMPLATE = 'template',
}

@Entity('scheduled_reports')
@Index(['workspaceId', 'isActive'])
@Index(['nextSendAt'])
export class ScheduledReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ReportType })
  reportType: ReportType;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Column({ type: 'text', comment: 'Cron expression' })
  schedule: string;

  @Column({ type: 'simple-array', comment: 'Email addresses' })
  recipients: string[];

  @Column({ type: 'enum', enum: ReportFormat, default: ReportFormat.PDF })
  format: ReportFormat;

  @Column({ type: 'jsonb', nullable: true, comment: 'Report filters and parameters' })
  config: Record<string, any>;

  @Column({ name: 'template_id', nullable: true })
  templateId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_sent_at', nullable: true })
  lastSentAt: Date;

  @Column({ name: 'next_send_at', nullable: true })
  nextSendAt: Date;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string;

  @Column({ name: 'send_count', default: 0 })
  sendCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
