/**
 * GraphQL decorators placeholder
 * Uncomment when @nestjs/graphql is installed
 */
/**
 * Extract current user from GraphQL context
 */
export declare const GqlCurrentUser: (...dataOrPipes: (string | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>>)[]) => ParameterDecorator;
/**
 * Extract pagination arguments from GraphQL
 */
export declare const GqlPagination: (...dataOrPipes: unknown[]) => ParameterDecorator;
/**
 * GraphQL pagination input type
 */
export interface PaginationInput {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
/**
 * GraphQL connection type for cursor-based pagination
 */
export interface Connection<T> {
    edges: Edge<T>[];
    pageInfo: PageInfo;
    totalCount: number;
}
export interface Edge<T> {
    cursor: string;
    node: T;
}
export interface PageInfo {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
}
