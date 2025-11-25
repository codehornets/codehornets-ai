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
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USER', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'funnelagents'),
        synchronize: configService.get('DATABASE_SYNC', 'false') === 'true',
        logging: configService.get('DATABASE_LOGGING', 'false') === 'true',
        entities: [CampaignEntity, CampaignTemplateEntity],
      }),
      inject: [ConfigService],
    }),
    CampaignsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
