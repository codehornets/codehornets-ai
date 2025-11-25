import { DynamicModule } from '@nestjs/common';
export interface MetricsModuleOptions {
    serviceName: string;
    defaultLabels?: Record<string, string>;
}
export declare class MetricsModule {
    static forRoot(options: MetricsModuleOptions): DynamicModule;
}
