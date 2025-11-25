import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
export declare const correlationIdStorage: AsyncLocalStorage<Map<string, any>>;
export declare const CORRELATION_ID_HEADER = "x-correlation-id";
export declare const REQUEST_ID_HEADER = "x-request-id";
export declare class CorrelationIdMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void;
}
export declare function getCorrelationId(): string | undefined;
export declare function getRequestId(): string | undefined;
export declare function getRequestContext(): Record<string, any>;
export declare function setContextValue(key: string, value: any): void;
export declare function getContextValue(key: string): any;
