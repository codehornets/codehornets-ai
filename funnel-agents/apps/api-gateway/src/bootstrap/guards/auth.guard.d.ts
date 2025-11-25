import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
export declare class AuthGuard implements CanActivate {
    private readonly authClient;
    constructor(authClient: ClientProxy);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractTokenFromHeader;
}
