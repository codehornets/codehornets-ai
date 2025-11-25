import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
/**
 * Role-based access control guard
 */
export declare class RolesGuard implements CanActivate {
    private readonly reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
/**
 * Permission-based access control guard
 */
export declare class PermissionsGuard implements CanActivate {
    private readonly reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
/**
 * Resource ownership guard
 * Ensures user can only access their own resources
 */
export declare class OwnershipGuard implements CanActivate {
    private readonly reflector;
    private readonly resourceService?;
    constructor(reflector: Reflector, resourceService?: {
        findById: (id: string) => Promise<{
            userId: string;
        } | null>;
    } | undefined);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
