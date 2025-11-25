import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
  IsUUID,
} from 'class-validator';
import { ContentType } from '../entities/content.entity';

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ContentType)
  content_type: ContentType;

  @IsOptional()
  @IsString()
  category?: string;

  @IsString()
  template_body: string;

  @IsObject()
  variables: Record<string, any>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @IsOptional()
  @IsUUID()
  created_by?: string;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  template_body?: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class RenderTemplateDto {
  @IsUUID()
  template_id: string;

  @IsObject()
  variable_values: Record<string, any>;
}

export class QueryTemplateDto {
  @IsOptional()
  @IsEnum(ContentType)
  content_type?: ContentType;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
