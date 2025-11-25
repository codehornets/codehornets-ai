import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ContentType,
  ContentStatus,
  ContentChannel,
} from '../entities/content.entity';

export class QueryContentDto {
  @IsOptional()
  @IsEnum(ContentType)
  type?: ContentType;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsEnum(ContentChannel)
  channel?: ContentChannel;

  @IsOptional()
  @IsUUID()
  workspace_id?: string;

  @IsOptional()
  @IsUUID()
  campaign_id?: string;

  @IsOptional()
  @IsUUID()
  author_id?: string;

  @IsOptional()
  @IsString()
  sort_by?: 'created_at' | 'updated_at' | 'published_at';

  @IsOptional()
  @IsString()
  sort_order?: 'ASC' | 'DESC';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
