import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from './pagination.dto';

export class ErrorDetailDto {
  @ApiProperty({ example: 'VALIDATION_ERROR', description: 'Error code' })
  code: string;

  @ApiProperty({ example: 'Validation failed', description: 'Error message' })
  message: string;

  @ApiPropertyOptional({ description: 'Additional error details' })
  details?: unknown;
}

export class ApiResponseDto<T> {
  @ApiProperty({ example: true, description: 'Whether the request was successful' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Response data' })
  data?: T;

  @ApiPropertyOptional({ type: ErrorDetailDto, description: 'Error details if request failed' })
  error?: ErrorDetailDto;

  @ApiPropertyOptional({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta?: PaginationMetaDto;
}

export class SuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean = true;

  @ApiProperty({ example: 'Operation completed successfully' })
  message?: string;
}

export class DeleteResponseDto extends SuccessResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID of deleted resource' })
  id: string;
}

export class BulkOperationResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 10, description: 'Number of items processed' })
  processed: number;

  @ApiProperty({ example: 2, description: 'Number of items failed' })
  failed: number;

  @ApiPropertyOptional({ description: 'Details of failed items' })
  errors?: Array<{ id: string; error: string }>;
}
