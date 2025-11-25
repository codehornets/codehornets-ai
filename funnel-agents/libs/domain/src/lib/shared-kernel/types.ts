/**
 * Common domain types
 */

/**
 * Generic result type for operations that can fail
 */
export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

export const Result = {
  ok<T>(value: T): Result<T, never> {
    return { success: true, value };
  },
  fail<E>(error: E): Result<never, E> {
    return { success: false, error };
  },
  isOk<T, E>(result: Result<T, E>): result is { success: true; value: T } {
    return result.success;
  },
  isFail<T, E>(result: Result<T, E>): result is { success: false; error: E } {
    return !result.success;
  },
};

/**
 * Optional type wrapper
 */
export type Optional<T> = T | null | undefined;

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Common status types
 */
export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

/**
 * Priority levels
 */
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Audit information
 */
export interface AuditInfo {
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
  updatedBy?: string;
}

/**
 * Repository interface
 */
export interface IRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(params?: PaginationParams): Promise<PaginatedResult<T>>;
  save(entity: T): Promise<T>;
  delete(id: ID): Promise<void>;
  exists(id: ID): Promise<boolean>;
}

/**
 * Unit of work interface
 */
export interface IUnitOfWork {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * Event publisher interface
 */
export interface IEventPublisher {
  publish<T>(event: T): Promise<void>;
  publishAll<T>(events: T[]): Promise<void>;
}
