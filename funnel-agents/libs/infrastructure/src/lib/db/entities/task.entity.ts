import { Entity, Column, Index } from 'typeorm';
import { BaseDbEntity } from './base.entity';

@Entity('tasks')
@Index(['status', 'priority'])
@Index(['agentId', 'status'])
@Index(['workspaceId'])
@Index(['campaignId'])
@Index(['scheduledFor'])
@Index(['createdAt'])
export class TaskDbEntity extends BaseDbEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  type: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  status: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  priority: string;

  @Column({ type: 'uuid' })
  @Index()
  agentId: string;

  @Column({ type: 'jsonb', nullable: true })
  inputData?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  outputData?: Record<string, any>;

  @Column({ type: 'jsonb', default: '[]' })
  executionLog: Array<{
    timestamp: string;
    level: string;
    message: string;
    metadata?: Record<string, any>;
  }>;

  @Column({ type: 'jsonb' })
  executionContext: {
    agentId: string;
    agentName?: string;
    startedAt?: string;
    endedAt?: string;
    executionTimeMs?: number;
    attempts: number;
    maxRetries: number;
    lastError?: string;
  };

  @Column({ type: 'jsonb' })
  metadata: {
    workspaceId?: string;
    campaignId?: string;
    clientId?: string;
    tags?: string[];
    source?: string;
    parentTaskId?: string;
    childTaskIds?: string[];
  };

  @Column({ type: 'jsonb' })
  config: {
    timeout?: number;
    retryPolicy?: {
      maxRetries: number;
      retryDelay: number;
      backoffMultiplier?: number;
    };
    requiresApproval?: boolean;
    notifyOnCompletion?: boolean;
    notificationChannels?: string[];
  };

  @Column({ type: 'uuid', nullable: true })
  @Index()
  workspaceId?: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  campaignId?: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  clientId?: string;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  scheduledFor?: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  completedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];
}
