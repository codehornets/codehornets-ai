import { Module, DynamicModule } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';

export interface MetricsModuleOptions {
  serviceName: string;
  defaultLabels?: Record<string, string>;
}

@Module({})
export class MetricsModule {
  static forRoot(options: MetricsModuleOptions): DynamicModule {
    return {
      module: MetricsModule,
      imports: [
        PrometheusModule.register({
          defaultLabels: {
            service: options.serviceName,
            environment: process.env.NODE_ENV || 'development',
            ...options.defaultLabels,
          },
          defaultMetrics: {
            enabled: true,
            config: {
              prefix: 'funnelagents_',
            },
          },
        }),
      ],
      controllers: [MetricsController],
      providers: [
        {
          provide: 'METRICS_SERVICE_NAME',
          useValue: options.serviceName,
        },
        MetricsService,
      ],
      exports: [MetricsService],
      global: true,
    };
  }
}
