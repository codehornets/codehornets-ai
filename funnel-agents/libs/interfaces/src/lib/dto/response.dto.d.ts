import { PaginationMetaDto } from './pagination.dto';
export declare class ErrorDetailDto {
    code: string;
    message: string;
    details?: unknown;
}
export declare class ApiResponseDto<T> {
    success: boolean;
    data?: T;
    error?: ErrorDetailDto;
    meta?: PaginationMetaDto;
}
export declare class SuccessResponseDto {
    success: boolean;
    message?: string;
}
export declare class DeleteResponseDto extends SuccessResponseDto {
    id: string;
}
export declare class BulkOperationResponseDto {
    success: boolean;
    processed: number;
    failed: number;
    errors?: Array<{
        id: string;
        error: string;
    }>;
}
