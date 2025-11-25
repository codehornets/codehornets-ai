import { IsOptional, IsEnum, IsUUID, IsNumber } from 'class-validator';

export class FilterDealDto {
  @IsOptional()
  @IsEnum(['discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'])
  stage?: 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

  @IsOptional()
  @IsUUID()
  workspace_id?: string;

  @IsOptional()
  @IsUUID()
  contact_id?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
