import { Type } from '@nestjs/common';
/**
 * Standard API response wrapper for Swagger documentation
 */
export declare class ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: {
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
    };
}
/**
 * Paginated API response
 */
export declare function ApiPaginatedResponse<TModel extends Type<any>>(model: TModel): <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
/**
 * Single item API response
 */
export declare function ApiItemResponse<TModel extends Type<any>>(model: TModel): <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
/**
 * Created item API response
 */
export declare function ApiCreatedItemResponse<TModel extends Type<any>>(model: TModel): <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
/**
 * Standard error responses decorator
 */
export declare function ApiStandardErrors(): <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
