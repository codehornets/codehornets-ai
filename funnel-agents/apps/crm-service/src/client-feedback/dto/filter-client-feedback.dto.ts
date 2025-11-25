import { IsOptional, IsEnum, IsUUID, IsNumber } from 'class-validator';

export class FilterClientFeedbackDto {
  @IsOptional()
  @IsUUID()
  workspace_id?: string;

  @IsOptional()
  @IsUUID()
  contact_id?: string;

  @IsOptional()
  @IsEnum(['positive', 'neutral', 'negative'])
  sentiment?: 'positive' | 'neutral' | 'negative';

  @IsOptional()
  @IsEnum(['new', 'in_review', 'addressed', 'closed'])
  status?: 'new' | 'in_review' | 'addressed' | 'closed';

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
