import { Module, DynamicModule, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { QueueOptions } from './queue.types';

export interface MessagingModuleOptions {
  connection: {
    host: string;
    port: number;
    password?: string;
  };
  queues: string[];
}

@Global()
@Module({})
export class MessagingModule {
  static forRoot(options: MessagingModuleOptions): DynamicModule {
    const queueModules = options.queues.map((name) =>
      BullModule.registerQueue({
        name,
        connection: options.connection,
      })
    );

    return {
      module: MessagingModule,
      imports: [
        BullModule.forRoot({
          connection: options.connection,
        }),
        ...queueModules,
      ],
      providers: [QueueService],
      exports: [BullModule, QueueService],
    };
  }

  static forRootAsync(optionsFactory: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<MessagingModuleOptions> | MessagingModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: MessagingModule,
      imports: [
        BullModule.forRootAsync({
          imports: optionsFactory.imports,
          useFactory: async (...args: any[]) => {
            const options = await optionsFactory.useFactory(...args);
            return {
              connection: options.connection,
            };
          },
          inject: optionsFactory.inject,
        }),
      ],
      providers: [QueueService],
      exports: [BullModule, QueueService],
    };
  }
}
