import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsObject, IsNumber, IsUUID, IsBoolean } from 'class-validator';

export enum TuningType {
  PROMPT = 'prompt',
  PARAMETERS = 'parameters',
  SKILLS = 'skills',
  MODEL = 'model',
}

export class CreateAgentTuningDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  agent_id: string;

  @ApiProperty({ enum: TuningType, example: TuningType.PROMPT })
  @IsEnum(TuningType)
  tuning_type: TuningType;

  @ApiPropertyOptional({ example: { temperature: 0.7 } })
  @IsOptional()
  @IsObject()
  before_value?: Record<string, any>;

  @ApiPropertyOptional({ example: { temperature: 0.8 } })
  @IsOptional()
  @IsObject()
  after_value?: Record<string, any>;

  @ApiPropertyOptional({ example: 5.5 })
  @IsOptional()
  @IsNumber()
  performance_delta?: number;

  @ApiPropertyOptional({ example: 'Improved response quality' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAgentTuningDto {
  @ApiPropertyOptional({ example: 7.2 })
  @IsOptional()
  @IsNumber()
  performance_delta?: number;

  @ApiPropertyOptional({ example: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  apply?: boolean;
}

export class AgentTuningResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  agent_id: string;

  @ApiProperty({ enum: TuningType })
  tuning_type: TuningType;

  @ApiPropertyOptional()
  before_value?: Record<string, any>;

  @ApiPropertyOptional()
  after_value?: Record<string, any>;

  @ApiPropertyOptional()
  performance_delta?: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  applied_at?: Date;

  @ApiProperty()
  created_at: Date;
}

export class AgentTuningFilterDto {
  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  agent_id?: string;

  @ApiPropertyOptional({ enum: TuningType })
  @IsOptional()
  @IsEnum(TuningType)
  tuning_type?: TuningType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  applied_only?: boolean;
}
