import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ReportType } from './scheduled-report.entity';

@Entity('report_templates')
@Index(['workspaceId', 'isPublic'])
export class ReportTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ReportType })
  reportType: ReportType;

  @Column({ name: 'workspace_id', nullable: true })
  workspaceId: string;

  @Column({ name: 'is_public', default: false, comment: 'System-wide template' })
  isPublic: boolean;

  @Column({ type: 'simple-array', comment: 'Metrics to include' })
  metrics: string[];

  @Column({ type: 'jsonb', nullable: true, comment: 'Default filters' })
  filters: Record<string, any>;

  @Column({ type: 'simple-array', nullable: true, comment: 'Fields to group by' })
  groupBy: string[];

  @Column({ type: 'jsonb', nullable: true, comment: 'Chart configurations' })
  charts: Record<string, any>;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
