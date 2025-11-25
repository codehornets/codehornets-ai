import { DynamicModule } from '@nestjs/common';
export interface LoggingModuleOptions {
    level?: 'error' | 'warn' | 'info' | 'debug' | 'verbose';
    pretty?: boolean;
    context?: string;
}
export declare class LoggingModule {
    static forRoot(options?: LoggingModuleOptions): DynamicModule;
}
