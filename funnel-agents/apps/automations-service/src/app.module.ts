import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowsModule } from './workflows/workflows.module';
import { WorkflowRunsModule } from './workflow-runs/workflow-runs.module';
import { Workflow } from './workflows/entities/workflow.entity';
import { WorkflowRun } from './workflow-runs/entities/workflow-run.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');

        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [Workflow, WorkflowRun],
            synchronize: configService.get('NODE_ENV') !== 'production',
            logging: configService.get('NODE_ENV') === 'development',
          };
        }

        return {
          type: 'postgres',
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get('DB_USERNAME', 'funnel_agents'),
          password: configService.get('DB_PASSWORD', 'secret'),
          database: configService.get('DB_DATABASE', 'funnel_agents'),
          entities: [Workflow, WorkflowRun],
          synchronize: configService.get('NODE_ENV') !== 'production',
          logging: configService.get('NODE_ENV') === 'development',
        };
      },
      inject: [ConfigService],
    }),
    WorkflowsModule,
    WorkflowRunsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
