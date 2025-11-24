import { createParamDecorator, ExecutionContext } from '@nestjs/common';
// import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * GraphQL decorators placeholder
 * Uncomment when @nestjs/graphql is installed
 */

/**
 * Extract current user from GraphQL context
 */
export const GqlCurrentUser = createParamDecorator((data: string, context: ExecutionContext) => {
  // Placeholder implementation
  // const ctx = GqlExecutionContext.create(context);
  // const request = ctx.getContext().req;
  // const user = request.user;
  // return data ? user?.[data] : user;
  return null;
});

/**
 * Extract pagination arguments from GraphQL
 */
export const GqlPagination = createParamDecorator((data: unknown, context: ExecutionContext) => {
  // Placeholder implementation
  // const ctx = GqlExecutionContext.create(context);
  // const args = ctx.getArgs();
  // return {
  //   page: args.page ?? 1,
  //   limit: args.limit ?? 10,
  //   sortBy: args.sortBy ?? 'createdAt',
  //   sortOrder: args.sortOrder ?? 'desc',
  // };
  return { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' };
});

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
