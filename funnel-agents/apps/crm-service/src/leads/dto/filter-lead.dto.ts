import { IsOptional, IsEnum, IsString, IsNumber } from 'class-validator';

export class FilterLeadDto {
  @IsOptional()
  @IsEnum([
    'new',
    'enriched',
    'qualified',
    'contacted',
    'in_conversation',
    'proposal_sent',
    'won',
    'lost',
  ])
  status?:
    | 'new'
    | 'enriched'
    | 'qualified'
    | 'contacted'
    | 'in_conversation'
    | 'proposal_sent'
    | 'won'
    | 'lost';

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsNumber()
  minScore?: number;

  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
