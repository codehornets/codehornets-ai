/**
 * Common domain types
 */
import { DomainEvent } from './base-entity';
/**
 * Generic result type for operations that can fail
 */
export type Result<T, E = Error> = {
    success: true;
    value: T;
} | {
    success: false;
    error: E;
};
export declare const Result: {
    ok<T>(value: T): Result<T, never>;
    fail<E>(error: E): Result<never, E>;
    isOk<T, E>(result: Result<T, E>): result is {
        success: true;
        value: T;
    };
    isFail<T, E>(result: Result<T, E>): result is {
        success: false;
        error: E;
    };
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
export declare enum Status {
    ACTIVE = "active",
    INACTIVE = "inactive",
    PENDING = "pending",
    ARCHIVED = "archived",
    DELETED = "deleted"
}
/**
 * Priority levels
 */
export declare enum Priority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
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
    publish<T extends DomainEvent>(event: T): Promise<void>;
    publishAll<T extends DomainEvent>(events: T[]): Promise<void>;
}
