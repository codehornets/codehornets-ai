import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
} from 'class-validator';

export class CreateLeadDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company?: string;

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
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsObject()
  score_breakdown?: {
    icp_fit: number;
    engagement: number;
    recency: number;
    confidence: number;
  };

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
