/**
 * Base domain error class
 */
export declare abstract class DomainError extends Error {
    readonly code: string;
    readonly timestamp: Date;
    constructor(message: string, code: string);
}
/**
 * Entity not found error
 */
export declare class EntityNotFoundError extends DomainError {
    constructor(entityName: string, id: string);
}
/**
 * Validation error
 */
export declare class ValidationError extends DomainError {
    readonly errors: ValidationErrorDetail[];
    constructor(errors: ValidationErrorDetail[]);
}
export interface ValidationErrorDetail {
    field: string;
    message: string;
    value?: unknown;
}
/**
 * Business rule violation error
 */
export declare class BusinessRuleViolationError extends DomainError {
    constructor(rule: string, message: string);
}
/**
 * Unauthorized access error
 */
export declare class UnauthorizedError extends DomainError {
    constructor(message?: string);
}
/**
 * Forbidden access error
 */
export declare class ForbiddenError extends DomainError {
    constructor(message?: string);
}
/**
 * Conflict error (e.g., duplicate entries)
 */
export declare class ConflictError extends DomainError {
    constructor(message: string);
}
/**
 * External service error
 */
export declare class ExternalServiceError extends DomainError {
    readonly serviceName: string;
    constructor(serviceName: string, message: string);
}
/**
 * Rate limit error
 */
export declare class RateLimitError extends DomainError {
    readonly retryAfter: number;
    constructor(retryAfter?: number);
}
