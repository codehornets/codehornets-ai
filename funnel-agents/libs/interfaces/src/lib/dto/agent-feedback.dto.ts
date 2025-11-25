import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsInt, Min, Max, IsUUID } from 'class-validator';

export enum FeedbackType {
  QUALITY = 'quality',
  SPEED = 'speed',
  ACCURACY = 'accuracy',
  GENERAL = 'general',
}

export class CreateAgentFeedbackDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  agent_id: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsOptional()
  @IsUUID()
  task_id?: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Great performance on this task' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ enum: FeedbackType, example: FeedbackType.QUALITY })
  @IsEnum(FeedbackType)
  feedback_type: FeedbackType;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsString()
  created_by?: string;
}

export class UpdateAgentFeedbackDto {
  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 'Updated feedback comment' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class AgentFeedbackResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  agent_id: string;

  @ApiPropertyOptional()
  task_id?: string;

  @ApiProperty()
  rating: number;

  @ApiPropertyOptional()
  comment?: string;

  @ApiProperty({ enum: FeedbackType })
  feedback_type: FeedbackType;

  @ApiPropertyOptional()
  created_by?: string;

  @ApiProperty()
  created_at: Date;
}

export class AgentFeedbackFilterDto {
  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  agent_id?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsOptional()
  @IsUUID()
  task_id?: string;

  @ApiPropertyOptional({ enum: FeedbackType })
  @IsOptional()
  @IsEnum(FeedbackType)
  feedback_type?: FeedbackType;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  min_rating?: number;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  max_rating?: number;
}
