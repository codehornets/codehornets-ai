import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from './env.schema';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  get nodeEnv(): string {
    return this.configService.get('NODE_ENV');
  }

  get port(): number {
    return this.configService.get('PORT');
  }

  get apiPrefix(): string {
    return this.configService.get('API_PREFIX');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  get database() {
    return {
      host: this.configService.get('DB_HOST'),
      port: this.configService.get('DB_PORT'),
      username: this.configService.get('DB_USERNAME'),
      password: this.configService.get('DB_PASSWORD'),
      database: this.configService.get('DB_DATABASE'),
      ssl: this.configService.get('DB_SSL'),
      synchronize: this.configService.get('DB_SYNCHRONIZE'),
      logging: this.configService.get('DB_LOGGING'),
    };
  }

  get redis() {
    return {
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
    };
  }

  get jwt() {
    return {
      secret: this.configService.get('JWT_SECRET'),
      expiration: this.configService.get('JWT_EXPIRATION'),
      refreshExpiration: this.configService.get('JWT_REFRESH_EXPIRATION'),
    };
  }

  get ai() {
    return {
      openaiApiKey: this.configService.get('OPENAI_API_KEY'),
      anthropicApiKey: this.configService.get('ANTHROPIC_API_KEY'),
    };
  }

  get smtp() {
    return {
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      user: this.configService.get('SMTP_USER'),
      password: this.configService.get('SMTP_PASSWORD'),
      from: this.configService.get('SMTP_FROM'),
    };
  }

  get logLevel(): string {
    return this.configService.get('LOG_LEVEL');
  }

  get<T>(key: keyof EnvConfig): T {
    return this.configService.get(key) as T;
  }
}
