export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface ApiResponseWrapper<T> {
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
export declare abstract class BaseController<Entity, CreateDto, UpdateDto> {
    protected abstract readonly service: {
        findById(id: string): Promise<Entity | null>;
        findAll(params?: PaginationQuery): Promise<{
            data: Entity[];
            meta: unknown;
        }>;
        create(data: CreateDto): Promise<Entity>;
        update?(id: string, data: UpdateDto): Promise<Entity>;
        delete(id: string): Promise<void>;
    };
    protected success<T>(data: T, meta?: ApiResponseWrapper<T>['meta']): ApiResponseWrapper<T>;
    protected error(code: string, message: string, details?: unknown): ApiResponseWrapper<null>;
    protected paginated<T>(data: T[], meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }): ApiResponseWrapper<T[]>;
}
