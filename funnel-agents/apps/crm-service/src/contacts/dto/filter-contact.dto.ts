import { IsOptional, IsEnum, IsString, IsUUID, IsNumber } from 'class-validator';

export class FilterContactDto {
  @IsOptional()
  @IsEnum(['lead', 'client', 'partner', 'other'])
  type?: 'lead' | 'client' | 'partner' | 'other';

  @IsOptional()
  @IsUUID()
  workspace_id?: string;

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
