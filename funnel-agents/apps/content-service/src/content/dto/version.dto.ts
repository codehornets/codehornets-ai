import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateVersionDto {
  @IsString()
  change_summary: string;

  @IsOptional()
  @IsUUID()
  changed_by?: string;
}

export class VersionCompareDto {
  @IsUUID()
  version1_id: string;

  @IsUUID()
  version2_id: string;
}

export class RollbackVersionDto {
  @IsUUID()
  version_id: string;

  @IsOptional()
  @IsString()
  rollback_reason?: string;
}
