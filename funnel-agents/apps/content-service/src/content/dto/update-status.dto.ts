import { IsEnum } from 'class-validator';
import { ContentStatus } from '../entities/content.entity';

export class UpdateStatusDto {
  @IsEnum(ContentStatus)
  status: ContentStatus;
}
