import { Params } from 'nestjs-pino';
export interface LoggerConfig {
    level: string;
    format: 'json' | 'pretty';
    redactPaths: string[];
}
export declare function createLoggerConfig(): LoggerConfig;
export declare function createPinoConfig(serviceName: string): Params;
export declare const SENSITIVE_FIELDS: string[];
export declare function sanitizeObject(obj: any): any;
