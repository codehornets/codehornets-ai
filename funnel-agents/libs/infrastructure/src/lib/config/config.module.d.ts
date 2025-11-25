import { DynamicModule } from '@nestjs/common';
export interface ConfigModuleOptions {
    envFilePath?: string | string[];
    isGlobal?: boolean;
    cache?: boolean;
}
export declare class ConfigModule {
    static forRoot(options?: ConfigModuleOptions): DynamicModule;
}
