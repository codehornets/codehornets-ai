import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsBoolean()
  onboarding_completed?: boolean;

  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsString()
  team_size?: string;

  @IsOptional()
  @IsString()
  industry?: string;
}
