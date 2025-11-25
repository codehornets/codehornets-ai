import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
/**
 * JWT Authentication Guard
 * Checks if the request has a valid JWT token
 */
export declare class JwtAuthGuard implements CanActivate {
    private readonly reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractTokenFromHeader;
    private validateToken;
}
/**
 * API Key Authentication Guard
 */
export declare class ApiKeyGuard implements CanActivate {
    private readonly reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
    private validateApiKey;
}
