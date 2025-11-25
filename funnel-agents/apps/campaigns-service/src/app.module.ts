import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@funnelagents/infrastructure';
import { CampaignsModule } from './campaigns/campaigns.module';
import { CampaignEntity } from './campaigns/entities/campaign.entity';
import { CampaignTemplateEntity } from './campaigns/entities/campaign-template.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');

        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [CampaignEntity, CampaignTemplateEntity],
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
          entities: [CampaignEntity, CampaignTemplateEntity],
          synchronize: configService.get('NODE_ENV') !== 'production',
          logging: configService.get('NODE_ENV') === 'development',
        };
      },
      inject: [ConfigService],
    }),
    CampaignsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
