import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsObject,
  Min,
  Max,
} from 'class-validator';

export class CreateClientFeedbackDto {
  @IsUUID()
  workspace_id: string;

  @IsOptional()
  @IsUUID()
  contact_id?: string;

  @IsString()
  subject: string;

  @IsString()
  feedback: string;

  @IsOptional()
  @IsEnum(['positive', 'neutral', 'negative'])
  sentiment?: 'positive' | 'neutral' | 'negative';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rating?: number;

  @IsOptional()
  @IsEnum(['new', 'in_review', 'addressed', 'closed'])
  status?: 'new' | 'in_review' | 'addressed' | 'closed';

  @IsOptional()
  @IsString()
  response?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
