import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from '@funnelagents/infrastructure';
import { CampaignsModule } from './campaigns/campaigns.module';
import { HealthModule } from './health/health.module';
import { CampaignEntity } from './campaigns/entities/campaign.entity';
import { CampaignTemplateEntity } from './campaigns/entities/campaign-template.entity';
import { CampaignAnalyticsEntity } from './campaigns/entities/campaign-analytics.entity';
import { CampaignChannelEntity } from './campaigns/entities/campaign-channel.entity';
import { CampaignScheduleEntity } from './campaigns/entities/campaign-schedule.entity';
import { CustomThrottlerGuard } from '@funnelagents/shared';
import { createThrottlerConfig, getRedisUrl } from '@funnelagents/shared';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = getRedisUrl();
        const useRedis = !!redisUrl && configService.get('NODE_ENV') !== 'test';
        return createThrottlerConfig(useRedis, redisUrl);
      },
    }),
    DatabaseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');

        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [
              CampaignEntity,
              CampaignTemplateEntity,
              CampaignAnalyticsEntity,
              CampaignChannelEntity,
              CampaignScheduleEntity,
            ],
            synchronize: false,
            logging: nodeEnv === 'development',
            nodeEnv,
            enableHealthMonitoring: true,
          };
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'funnel_agents'),
          password: configService.get<string>('DB_PASSWORD', 'secret'),
          database: configService.get<string>('DB_DATABASE', 'funnel_agents'),
          entities: [
            CampaignEntity,
            CampaignTemplateEntity,
            CampaignAnalyticsEntity,
            CampaignChannelEntity,
            CampaignScheduleEntity,
          ],
          synchronize: false,
          logging: nodeEnv === 'development',
          nodeEnv,
          enableHealthMonitoring: true,
        };
      },
      inject: [ConfigService],
    }),
    CampaignsModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
