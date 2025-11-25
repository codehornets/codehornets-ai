import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { Content } from './entities/content.entity';
import { ContentVersion } from './entities/content-version.entity';
import { ContentApproval } from './entities/content-approval.entity';
import { ContentPublish } from './entities/content-publish.entity';
import { ContentTemplate } from './entities/content-template.entity';
import { ContentAnalytics } from './entities/content-analytics.entity';
import { VersionService } from './services/version.service';
import { ApprovalService } from './services/approval.service';
import { PublishService } from './services/publish.service';
import { TemplateService } from './services/template.service';
import { AnalyticsService } from './services/analytics.service';
import { VersionController } from './controllers/version.controller';
import { ApprovalController } from './controllers/approval.controller';
import { PublishController } from './controllers/publish.controller';
import { TemplateController } from './controllers/template.controller';
import { AnalyticsController } from './controllers/analytics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Content,
      ContentVersion,
      ContentApproval,
      ContentPublish,
      ContentTemplate,
      ContentAnalytics,
    ]),
  ],
  controllers: [
    ContentController,
    VersionController,
    ApprovalController,
    PublishController,
    TemplateController,
    AnalyticsController,
  ],
  providers: [
    ContentService,
    VersionService,
    ApprovalService,
    PublishService,
    TemplateService,
    AnalyticsService,
  ],
  exports: [
    ContentService,
    VersionService,
    ApprovalService,
    PublishService,
    TemplateService,
    AnalyticsService,
  ],
})
export class ContentModule {}
