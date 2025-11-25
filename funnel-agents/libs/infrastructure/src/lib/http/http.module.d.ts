import { DynamicModule } from '@nestjs/common';
import { HttpClientOptions } from './http.types';
export declare class HttpClientModule {
    static forRoot(options?: HttpClientOptions): DynamicModule;
    static forRootAsync(optionsFactory: {
        imports?: any[];
        useFactory: (...args: any[]) => Promise<HttpClientOptions> | HttpClientOptions;
        inject?: any[];
    }): DynamicModule;
}
