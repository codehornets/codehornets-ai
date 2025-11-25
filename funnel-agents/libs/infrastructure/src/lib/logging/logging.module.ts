import { Module, Global, DynamicModule } from '@nestjs/common';
import { AppLoggerService } from './logger.service';
import { LoggingInterceptor } from './logging.interceptor';

export interface LoggingModuleOptions {
  level?: 'error' | 'warn' | 'info' | 'debug' | 'verbose';
  pretty?: boolean;
  context?: string;
}

@Global()
@Module({})
export class LoggingModule {
  static forRoot(options: LoggingModuleOptions = {}): DynamicModule {
    return {
      module: LoggingModule,
      providers: [
        {
          provide: 'LOGGING_OPTIONS',
          useValue: options,
        },
        AppLoggerService,
        LoggingInterceptor,
      ],
      exports: [AppLoggerService, LoggingInterceptor],
    };
  }
}
