import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';

// Entities
import { CampaignEntity } from './entities/campaign.entity';
import { CampaignTemplateEntity } from './entities/campaign-template.entity';
import { CampaignAnalyticsEntity } from './entities/campaign-analytics.entity';
import { CampaignChannelEntity } from './entities/campaign-channel.entity';
import { CampaignScheduleEntity } from './entities/campaign-schedule.entity';

// Repositories
import { CampaignRepository } from './repositories/campaign.repository';
import { CampaignTemplateRepository } from './repositories/campaign-template.repository';
import { CampaignAnalyticsRepository } from './repositories/campaign-analytics.repository';
import { CampaignChannelRepository } from './repositories/campaign-channel.repository';
import { CampaignScheduleRepository } from './repositories/campaign-schedule.repository';

// Services
import { CampaignsService } from './services/campaigns.service';
import { CampaignTemplatesService } from './services/campaign-templates.service';
import { CampaignAnalyticsService } from './services/campaign-analytics.service';
import { CampaignChannelsService } from './services/campaign-channels.service';
import { CampaignSchedulingService } from './services/campaign-scheduling.service';
import { CampaignTasksService } from './services/campaign-tasks.service';

// Controllers
import { CampaignsController } from './controllers/campaigns.controller';
import { CampaignTemplatesController } from './controllers/campaign-templates.controller';
import { CampaignAnalyticsController } from './controllers/campaign-analytics.controller';
import { CampaignChannelsController } from './controllers/campaign-channels.controller';
import { CampaignSchedulingController } from './controllers/campaign-scheduling.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CampaignEntity,
      CampaignTemplateEntity,
      CampaignAnalyticsEntity,
      CampaignChannelEntity,
      CampaignScheduleEntity,
    ]),
    ClientsModule.register([
      {
        name: 'TASKS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.TASKS_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.TASKS_SERVICE_PORT || '3006', 10),
        },
      },
      {
        name: 'SCHEDULER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.SCHEDULER_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.SCHEDULER_SERVICE_PORT || '3009', 10),
        },
      },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [
    CampaignsController,
    CampaignTemplatesController,
    CampaignAnalyticsController,
    CampaignChannelsController,
    CampaignSchedulingController,
  ],
  providers: [
    CampaignRepository,
    CampaignTemplateRepository,
    CampaignAnalyticsRepository,
    CampaignChannelRepository,
    CampaignScheduleRepository,
    CampaignsService,
    CampaignTemplatesService,
    CampaignAnalyticsService,
    CampaignChannelsService,
    CampaignSchedulingService,
    CampaignTasksService,
  ],
  exports: [
    CampaignsService,
    CampaignTemplatesService,
    CampaignAnalyticsService,
    CampaignChannelsService,
    CampaignSchedulingService,
    CampaignTasksService,
  ],
})
export class CampaignsModule {}
