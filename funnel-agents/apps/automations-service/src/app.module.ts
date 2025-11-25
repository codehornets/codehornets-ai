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
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'funnelagents'),
        entities: [Workflow, WorkflowRun],
        synchronize: configService.get('DB_SYNCHRONIZE', 'false') === 'true',
        logging: configService.get('DB_LOGGING', 'false') === 'true',
      }),
      inject: [ConfigService],
    }),
    WorkflowsModule,
    WorkflowRunsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
