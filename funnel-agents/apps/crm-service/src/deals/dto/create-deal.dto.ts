import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreateDealDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  workspace_id?: string;

  @IsOptional()
  @IsUUID()
  contact_id?: string;

  @IsNumber()
  value: number;

  @IsOptional()
  @IsEnum(['discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'])
  stage?: 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

  @IsOptional()
  @IsDateString()
  expected_close_date?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}
