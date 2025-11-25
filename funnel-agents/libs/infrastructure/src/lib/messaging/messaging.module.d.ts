import { DynamicModule } from '@nestjs/common';
export interface MessagingModuleOptions {
    connection: {
        host: string;
        port: number;
        password?: string;
    };
    queues: string[];
}
export declare class MessagingModule {
    static forRoot(options: MessagingModuleOptions): DynamicModule;
    static forRootAsync(optionsFactory: {
        imports?: any[];
        useFactory: (...args: any[]) => Promise<MessagingModuleOptions> | MessagingModuleOptions;
        inject?: any[];
    }): DynamicModule;
}
