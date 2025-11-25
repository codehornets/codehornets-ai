import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import {
  TaskEntity,
  AgentEntity,
  FeedbackEntity,
  ScheduledReportEntity,
  ReportTemplateEntity,
  LeadEntity,
  CampaignEntity,
  DealEntity,
} from './entities';
import { ScheduledReportsController } from './controllers/scheduled-reports.controller';
import { ReportTemplatesController } from './controllers/report-templates.controller';
import { FeedbackController } from './controllers/feedback.controller';
import { CustomReportsController } from './controllers/custom-reports.controller';
import { PdfExportService } from './services/pdf-export.service';
import { ExcelExportService } from './services/excel-export.service';
import { CacheService } from './services/cache.service';
import { ReportSchedulerService } from './services/report-scheduler.service';
import { EmailService } from './services/email.service';
import { CustomReportService } from './services/custom-report.service';
import { ReportTemplateService } from './services/report-template.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaskEntity,
      AgentEntity,
      FeedbackEntity,
      ScheduledReportEntity,
      ReportTemplateEntity,
      LeadEntity,
      CampaignEntity,
      DealEntity,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [
    AnalyticsController,
    ScheduledReportsController,
    ReportTemplatesController,
    FeedbackController,
    CustomReportsController,
  ],
  providers: [
    AnalyticsService,
    PdfExportService,
    ExcelExportService,
    CacheService,
    ReportSchedulerService,
    EmailService,
    CustomReportService,
    ReportTemplateService,
  ],
  exports: [
    AnalyticsService,
    PdfExportService,
    ExcelExportService,
    CacheService,
    ReportSchedulerService,
    CustomReportService,
    ReportTemplateService,
  ],
})
export class AnalyticsModule {}
