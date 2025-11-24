import { Module, Global, DynamicModule } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AppConfigService } from './config.service';
import { envSchema } from './env.schema';

export interface ConfigModuleOptions {
  envFilePath?: string | string[];
  isGlobal?: boolean;
  cache?: boolean;
}

@Global()
@Module({})
export class ConfigModule {
  static forRoot(options: ConfigModuleOptions = {}): DynamicModule {
    return {
      module: ConfigModule,
      imports: [
        NestConfigModule.forRoot({
          envFilePath: options.envFilePath ?? '.env',
          isGlobal: options.isGlobal ?? true,
          cache: options.cache ?? true,
          validationSchema: envSchema,
          validationOptions: {
            allowUnknown: true,
            abortEarly: false,
          },
        }),
      ],
      providers: [AppConfigService],
      exports: [AppConfigService, NestConfigModule],
    };
  }
}
