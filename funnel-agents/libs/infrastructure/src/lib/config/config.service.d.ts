import { ConfigService } from '@nestjs/config';
import { EnvConfig } from './env.schema';
export declare class AppConfigService {
    private readonly configService;
    constructor(configService: ConfigService<EnvConfig, true>);
    get nodeEnv(): string;
    get port(): number;
    get apiPrefix(): string;
    get isDevelopment(): boolean;
    get isProduction(): boolean;
    get isTest(): boolean;
    get database(): {
        host: any;
        port: any;
        username: any;
        password: any;
        database: any;
        ssl: any;
        synchronize: any;
        logging: any;
    };
    get redis(): {
        host: any;
        port: any;
        password: any;
    };
    get jwt(): {
        secret: any;
        expiration: any;
        refreshExpiration: any;
    };
    get ai(): {
        openaiApiKey: any;
        anthropicApiKey: any;
    };
    get smtp(): {
        host: any;
        port: any;
        user: any;
        password: any;
        from: any;
    };
    get logLevel(): string;
    get<T>(key: keyof EnvConfig): T;
}
