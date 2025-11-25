import { IsString, IsEmail, IsOptional, IsEnum, IsUUID } from 'class-validator';

export class CreateContactDto {
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
  @IsEnum(['lead', 'client', 'partner', 'other'])
  type?: 'lead' | 'client' | 'partner' | 'other';

  @IsOptional()
  @IsUUID()
  workspace_id?: string;

  @IsOptional()
  @IsString()
  linkedin_url?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
