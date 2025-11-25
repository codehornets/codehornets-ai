import { IsString, IsInt, IsOptional, Min, Max, IsObject } from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  agentId: string;

  @IsString()
  workspaceId: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class FeedbackStatsDto {
  agentId: string;
  totalFeedback: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  trend: {
    date: string;
    averageRating: number;
    count: number;
  }[];
}
