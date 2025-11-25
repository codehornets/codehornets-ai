/**
 * Extract pagination parameters from query
 */
export declare const Pagination: (...dataOrPipes: unknown[]) => ParameterDecorator;
/**
 * Extract current user from request
 */
export declare const CurrentUser: (...dataOrPipes: (string | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>>)[]) => ParameterDecorator;
/**
 * Extract correlation ID from request
 */
export declare const CorrelationId: (...dataOrPipes: unknown[]) => ParameterDecorator;
/**
 * Mark route as public (no auth required)
 */
export declare const IS_PUBLIC_KEY = "isPublic";
export declare const Public: () => import("@nestjs/common").CustomDecorator<string>;
/**
 * Set required roles for route
 */
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: string[]) => import("@nestjs/common").CustomDecorator<string>;
/**
 * Set required permissions for route
 */
export declare const PERMISSIONS_KEY = "permissions";
export declare const Permissions: (...permissions: string[]) => import("@nestjs/common").CustomDecorator<string>;
/**
 * API Pagination decorator for Swagger docs
 */
export declare function ApiPagination(): <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
/**
 * API Correlation ID header decorator for Swagger docs
 */
export declare function ApiCorrelationId(): MethodDecorator & ClassDecorator;
