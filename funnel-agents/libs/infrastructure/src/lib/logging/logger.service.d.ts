import { LoggerService } from '@nestjs/common';
export interface LogContext {
    correlationId?: string;
    userId?: string;
    requestId?: string;
    [key: string]: unknown;
}
export declare class AppLoggerService implements LoggerService {
    private options?;
    private context?;
    private logLevel;
    private pretty;
    constructor(options?: {
        level?: string;
        pretty?: boolean;
        context?: string;
    } | undefined);
    setContext(context: string): void;
    log(message: string, context?: string | LogContext): void;
    error(message: string, trace?: string, context?: string | LogContext): void;
    warn(message: string, context?: string | LogContext): void;
    debug(message: string, context?: string | LogContext): void;
    verbose(message: string, context?: string | LogContext): void;
    private writeLog;
    private shouldLog;
    private colorize;
}
