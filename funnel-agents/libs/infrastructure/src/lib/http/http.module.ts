import { Module, Global, DynamicModule } from '@nestjs/common';
import { HttpModule as NestHttpModule } from '@nestjs/axios';
import { HttpClientService } from './http.service';
import { HttpClientOptions } from './http.types';

@Global()
@Module({})
export class HttpClientModule {
  static forRoot(options: HttpClientOptions = {}): DynamicModule {
    return {
      module: HttpClientModule,
      imports: [
        NestHttpModule.register({
          baseURL: options.baseUrl,
          timeout: options.timeout ?? 30000,
          headers: options.headers,
        }),
      ],
      providers: [
        {
          provide: 'HTTP_CLIENT_OPTIONS',
          useValue: options,
        },
        HttpClientService,
      ],
      exports: [HttpClientService, NestHttpModule],
    };
  }

  static forRootAsync(optionsFactory: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<HttpClientOptions> | HttpClientOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: HttpClientModule,
      imports: [
        NestHttpModule.registerAsync({
          imports: optionsFactory.imports,
          useFactory: async (...args: any[]) => {
            const options = await optionsFactory.useFactory(...args);
            return {
              baseURL: options.baseUrl,
              timeout: options.timeout ?? 30000,
              headers: options.headers,
            };
          },
          inject: optionsFactory.inject,
        }),
      ],
      providers: [
        {
          provide: 'HTTP_CLIENT_OPTIONS',
          useFactory: optionsFactory.useFactory,
          inject: optionsFactory.inject,
        },
        HttpClientService,
      ],
      exports: [HttpClientService, NestHttpModule],
    };
  }
}
