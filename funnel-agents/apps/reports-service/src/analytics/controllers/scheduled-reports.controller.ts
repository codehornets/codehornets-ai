import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduledReportEntity } from '../entities/scheduled-report.entity';
import {
  CreateScheduledReportDto,
  UpdateScheduledReportDto,
  ScheduledReportResponseDto,
} from '../dto/scheduled-report.dto';
import { ReportSchedulerService } from '../services/report-scheduler.service';

@Controller('scheduled-reports')
export class ScheduledReportsController {
  constructor(
    @InjectRepository(ScheduledReportEntity)
    private readonly scheduledReportRepository: Repository<ScheduledReportEntity>,
    private readonly reportSchedulerService: ReportSchedulerService,
  ) {}

  @Post()
  @MessagePattern({ cmd: 'create_scheduled_report' })
  async create(@Body() dto: CreateScheduledReportDto): Promise<ScheduledReportResponseDto> {
    const report = this.scheduledReportRepository.create(dto);

    // Calculate first send time
    const nextSendAt = this.calculateNextSendTime(dto.schedule);
    report.nextSendAt = nextSendAt;

    const saved = await this.scheduledReportRepository.save(report);

    return this.toResponseDto(saved);
  }

  @Get()
  @MessagePattern({ cmd: 'list_scheduled_reports' })
  async findAll(@Query('workspace_id') workspaceId?: string): Promise<ScheduledReportResponseDto[]> {
    const query = this.scheduledReportRepository.createQueryBuilder('report');

    if (workspaceId) {
      query.where('report.workspace_id = :workspaceId', { workspaceId });
    }

    query.orderBy('report.created_at', 'DESC');

    const reports = await query.getMany();

    return reports.map((r) => this.toResponseDto(r));
  }

  @Get(':id')
  @MessagePattern({ cmd: 'get_scheduled_report' })
  async findOne(@Param('id') id: string): Promise<ScheduledReportResponseDto> {
    const report = await this.scheduledReportRepository.findOne({
      where: { id },
    });

    if (!report) {
      throw new Error(`Report not found: ${id}`);
    }

    return this.toResponseDto(report);
  }

  @Put(':id')
  @MessagePattern({ cmd: 'update_scheduled_report' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateScheduledReportDto,
  ): Promise<ScheduledReportResponseDto> {
    const report = await this.scheduledReportRepository.findOne({
      where: { id },
    });

    if (!report) {
      throw new Error(`Report not found: ${id}`);
    }

    Object.assign(report, dto);

    // Recalculate next send time if schedule changed
    if (dto.schedule) {
      report.nextSendAt = this.calculateNextSendTime(dto.schedule);
    }

    const updated = await this.scheduledReportRepository.save(report);

    return this.toResponseDto(updated);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @MessagePattern({ cmd: 'delete_scheduled_report' })
  async remove(@Param('id') id: string): Promise<void> {
    const report = await this.scheduledReportRepository.findOne({
      where: { id },
    });

    if (!report) {
      throw new Error(`Report not found: ${id}`);
    }

    await this.scheduledReportRepository.remove(report);
  }

  @Post(':id/trigger')
  @HttpCode(HttpStatus.ACCEPTED)
  @MessagePattern({ cmd: 'trigger_scheduled_report' })
  async trigger(@Param('id') id: string): Promise<{ message: string }> {
    await this.reportSchedulerService.triggerReport(id);

    return { message: 'Report generation triggered' };
  }

  private toResponseDto(report: ScheduledReportEntity): ScheduledReportResponseDto {
    return {
      id: report.id,
      name: report.name,
      reportType: report.reportType,
      schedule: report.schedule,
      recipients: report.recipients,
      format: report.format,
      isActive: report.isActive,
      lastSentAt: report.lastSentAt,
      nextSendAt: report.nextSendAt,
      sendCount: report.sendCount,
      createdAt: report.createdAt,
    };
  }

  private calculateNextSendTime(cronExpression: string): Date {
    try {
      const { parseExpression } = require('cron-parser');
      const interval = parseExpression(cronExpression);
      return interval.next().toDate();
    } catch (error) {
      // Default to next day if parsing fails
      const next = new Date();
      next.setDate(next.getDate() + 1);
      return next;
    }
  }
}
