import * as Joi from 'joi';
export declare const envSchema: Joi.ObjectSchema<any>;
export interface EnvConfig {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: number;
    API_PREFIX: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_DATABASE: string;
    DB_SSL: boolean;
    DB_SYNCHRONIZE: boolean;
    DB_LOGGING: boolean;
    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_PASSWORD?: string;
    JWT_SECRET: string;
    JWT_EXPIRATION: string;
    JWT_REFRESH_EXPIRATION: string;
    OPENAI_API_KEY?: string;
    ANTHROPIC_API_KEY?: string;
    SMTP_HOST?: string;
    SMTP_PORT: number;
    SMTP_USER?: string;
    SMTP_PASSWORD?: string;
    SMTP_FROM?: string;
    LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug' | 'verbose';
}
