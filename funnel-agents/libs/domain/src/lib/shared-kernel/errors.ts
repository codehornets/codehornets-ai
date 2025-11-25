/**
 * Base domain error class
 */
export abstract class DomainError extends Error {
  public readonly code: string;
  public readonly timestamp: Date;

  constructor(message: string, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Entity not found error
 */
export class EntityNotFoundError extends DomainError {
  constructor(entityName: string, id: string) {
    super(`${entityName} with id ${id} not found`, 'ENTITY_NOT_FOUND');
  }
}

/**
 * Validation error
 */
export class ValidationError extends DomainError {
  public readonly errors: ValidationErrorDetail[];

  constructor(errors: ValidationErrorDetail[]) {
    super('Validation failed', 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Business rule violation error
 */
export class BusinessRuleViolationError extends DomainError {
  constructor(rule: string, message: string) {
    super(`Business rule violation [${rule}]: ${message}`, 'BUSINESS_RULE_VIOLATION');
  }
}

/**
 * Unauthorized access error
 */
export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden access error
 */
export class ForbiddenError extends DomainError {
  constructor(message: string = 'Access forbidden') {
    super(message, 'FORBIDDEN');
  }
}

/**
 * Conflict error (e.g., duplicate entries)
 */
export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT');
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends DomainError {
  public readonly serviceName: string;

  constructor(serviceName: string, message: string) {
    super(`External service error [${serviceName}]: ${message}`, 'EXTERNAL_SERVICE_ERROR');
    this.serviceName = serviceName;
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends DomainError {
  public readonly retryAfter: number;

  constructor(retryAfter: number = 60) {
    super(`Rate limit exceeded. Retry after ${retryAfter} seconds`, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}
