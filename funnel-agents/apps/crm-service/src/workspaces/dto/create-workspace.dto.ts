import { IsString, IsOptional, IsEnum, IsArray, IsObject } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'archived'])
  status?: 'active' | 'inactive' | 'archived';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  team_members?: string[];

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
