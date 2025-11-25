import { ExecutionContext } from '@nestjs/common';
import { TokenBlacklistService } from '../services/token-blacklist.service';
import { Reflector } from '@nestjs/core';
declare const JwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtAuthGuard extends JwtAuthGuard_base {
    private readonly tokenBlacklistService;
    private readonly reflector;
    constructor(tokenBlacklistService: TokenBlacklistService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export {};
