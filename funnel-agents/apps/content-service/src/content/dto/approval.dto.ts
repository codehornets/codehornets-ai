import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { ApprovalStatus } from '../entities/content-approval.entity';

export class CreateApprovalDto {
  @IsUUID()
  content_id: string;

  @IsUUID()
  reviewer_id: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  approval_step?: number;
}

export class UpdateApprovalDto {
  @IsEnum(ApprovalStatus)
  status: ApprovalStatus;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class AssignReviewersDto {
  @IsUUID('4', { each: true })
  reviewer_ids: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  approval_step?: number;
}
