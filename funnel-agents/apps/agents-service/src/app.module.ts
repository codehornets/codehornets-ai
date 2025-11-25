import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsModule } from './modules/agents.module';
import {
  AgentDbEntity,
  AgentFeedbackDbEntity,
  AgentTuningDbEntity,
  AgentTemplateDbEntity,
} from '@funnelagents/infrastructure';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');

        // Parse PostgreSQL connection string
        // Format: postgresql://user:password@host:port/database
        let config: any = {
          type: 'postgres',
          synchronize: configService.get<string>('NODE_ENV') !== 'production',
          logging: configService.get<string>('NODE_ENV') === 'development',
          entities: [AgentDbEntity, AgentFeedbackDbEntity, AgentTuningDbEntity, AgentTemplateDbEntity],
          autoLoadEntities: true,
        };

        if (databaseUrl) {
          const url = new URL(databaseUrl);
          config = {
            ...config,
            host: url.hostname,
            port: parseInt(url.port, 10) || 5432,
            username: url.username,
            password: url.password,
            database: url.pathname.slice(1),
          };
        } else {
          config = {
            ...config,
            host: configService.get<string>('DB_HOST', 'localhost'),
            port: configService.get<number>('DB_PORT', 5432),
            username: configService.get<string>('DB_USERNAME', 'funnel_agents'),
            password: configService.get<string>('DB_PASSWORD', 'secret'),
            database: configService.get<string>('DB_DATABASE', 'funnel_agents'),
          };
        }

        return config;
      },
    }),
    AgentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
