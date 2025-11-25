import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { CampaignEntity } from './entities/campaign.entity';
import { CampaignTemplateEntity } from './entities/campaign-template.entity';

// Repositories
import { CampaignRepository } from './repositories/campaign.repository';
import { CampaignTemplateRepository } from './repositories/campaign-template.repository';

// Services
import { CampaignsService } from './services/campaigns.service';
import { CampaignTemplatesService } from './services/campaign-templates.service';

// Controllers
import { CampaignsController } from './controllers/campaigns.controller';
import { CampaignTemplatesController } from './controllers/campaign-templates.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CampaignEntity, CampaignTemplateEntity]),
  ],
  controllers: [CampaignsController, CampaignTemplatesController],
  providers: [
    CampaignRepository,
    CampaignTemplateRepository,
    CampaignsService,
    CampaignTemplatesService,
  ],
  exports: [CampaignsService, CampaignTemplatesService],
})
export class CampaignsModule {}
