import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsNumber,
  IsUrl,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

export enum TaskType {
  MARKET_RESEARCH = 'market_research',
  CONTENT_CREATION = 'content_creation',
  LEAD_QUALIFICATION = 'lead_qualification',
  SEO_OPTIMIZATION = 'seo_optimization',
  EMAIL_CAMPAIGN = 'email_campaign',
  SOCIAL_MEDIA_POST = 'social_media_post',
  COMPETITOR_ANALYSIS = 'competitor_analysis',
  REPORT_GENERATION = 'report_generation',
  CUSTOM = 'custom',
}

export enum ExecutionPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled',
}

export class AgentInvocationDto {
  @ApiProperty({ example: 'agent-123-uuid' })
  @IsString()
  agent_id: string;

  @ApiProperty({ enum: TaskType, example: TaskType.CONTENT_CREATION })
  @IsEnum(TaskType)
  task_type: TaskType;

  @ApiProperty({
    example: {
      topic: 'AI in Marketing',
      target_audience: 'B2B SaaS companies',
      word_count: 1000,
    },
  })
  @IsObject()
  input_data: Record<string, any>;

  @ApiPropertyOptional({ example: 300, description: 'Timeout in seconds', minimum: 10, maximum: 600 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(600)
  timeout?: number;

  @ApiPropertyOptional({ enum: ExecutionPriority, example: ExecutionPriority.NORMAL })
  @IsOptional()
  @IsEnum(ExecutionPriority)
  priority?: ExecutionPriority;

  @ApiPropertyOptional({ example: 'https://webhook.site/callback' })
  @IsOptional()
  @IsUrl()
  callback_url?: string;

  @ApiPropertyOptional({ example: { user_id: 'user-123', session_id: 'session-456' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ExecuteAgentDto {
  @ApiProperty({ example: 'agent-123-uuid' })
  @IsString()
  agentId: string;

  @ApiProperty({
    example: {
      task: 'Generate blog post',
      context: { topic: 'AI Marketing Trends 2025' },
    },
  })
  @IsObject()
  input: Record<string, any>;

  @ApiPropertyOptional({ example: 300, description: 'Timeout in seconds' })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(600)
  timeout?: number;

  @ApiPropertyOptional({ example: true, description: 'Stream execution logs' })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;
}

export class AgentExecutionResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    example: {
      content: 'Generated blog post content...',
      word_count: 1200,
      seo_score: 85,
    },
  })
  output_data: Record<string, any>;

  @ApiProperty({ example: 12500, description: 'Execution time in milliseconds' })
  execution_time: number;

  @ApiProperty({
    example: [
      '[2025-01-15 10:00:00] Starting task execution',
      '[2025-01-15 10:00:05] Analyzing input data',
      '[2025-01-15 10:00:12] Task completed successfully',
    ],
  })
  logs: string[];

  @ApiPropertyOptional({
    example: {
      tokens_used: 1500,
      model_calls: 3,
      cache_hits: 2,
    },
  })
  metrics?: Record<string, any>;

  @ApiPropertyOptional({
    example: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input parameters',
      details: {},
    },
  })
  error?: {
    code: string;
    message: string;
    details?: any;
  };

  @ApiProperty({ example: 'exec-789-uuid' })
  execution_id: string;

  @ApiProperty({ example: 'agent-123-uuid' })
  agent_id: string;

  @ApiProperty({ enum: ExecutionStatus, example: ExecutionStatus.COMPLETED })
  status: ExecutionStatus;

  @ApiProperty()
  started_at: Date;

  @ApiProperty()
  completed_at: Date;
}

export class ExecutionLogDto {
  @ApiProperty()
  timestamp: Date;

  @ApiProperty({ example: 'info' })
  level: string;

  @ApiProperty({ example: 'Task started successfully' })
  message: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;
}

export class AgentExecutionStatusDto {
  @ApiProperty({ example: 'exec-789-uuid' })
  execution_id: string;

  @ApiProperty({ enum: ExecutionStatus })
  status: ExecutionStatus;

  @ApiProperty({ example: 45.5, description: 'Progress percentage' })
  progress: number;

  @ApiPropertyOptional({ example: 'Processing data...' })
  current_step?: string;

  @ApiPropertyOptional()
  estimated_completion?: Date;

  @ApiProperty()
  logs: ExecutionLogDto[];
}
