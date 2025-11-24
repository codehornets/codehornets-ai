import { Injectable } from '@nestjs/common';
import {
  Report,
  IReportRepository,
  ReportFilters,
  ReportType,
  ReportFormat,
  ReportConfig,
  ReportData,
  ReportSchedule,
  UniqueId,
} from '@funnelagents/domain';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';

@Injectable()
export class ReportsService {
  constructor(private readonly reportRepository: IReportRepository) {}

  async findById(id: string): Promise<Report | null> {
    return this.reportRepository.findById(id);
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<Report>> {
    return this.reportRepository.findAll(params);
  }

  async findScheduled(): Promise<Report[]> {
    return this.reportRepository.findScheduledReports();
  }

  async findWithFilters(
    filters: ReportFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<Report>> {
    return this.reportRepository.findWithFilters(filters, params);
  }

  async create(data: {
    name: string;
    description?: string;
    type: ReportType;
    format: ReportFormat;
    clientId?: string;
    config: ReportConfig;
    schedule?: ReportSchedule;
  }): Promise<Report> {
    const report = Report.create({
      name: data.name,
      description: data.description,
      type: data.type,
      format: data.format,
      clientId: data.clientId ? UniqueId.fromString(data.clientId) : undefined,
      config: data.config,
      schedule: data.schedule,
    });

    return this.reportRepository.save(report);
  }

  async generate(id: string): Promise<Report> {
    const report = await this.reportRepository.findById(id);
    if (!report) {
      throw new Error(`Report with id ${id} not found`);
    }

    report.startGeneration();
    return this.reportRepository.save(report);
  }

  async complete(id: string, data: ReportData, fileUrl?: string): Promise<Report> {
    const report = await this.reportRepository.findById(id);
    if (!report) {
      throw new Error(`Report with id ${id} not found`);
    }

    report.complete(data, fileUrl);
    return this.reportRepository.save(report);
  }

  async fail(id: string, error: string): Promise<Report> {
    const report = await this.reportRepository.findById(id);
    if (!report) {
      throw new Error(`Report with id ${id} not found`);
    }

    report.fail(error);
    return this.reportRepository.save(report);
  }

  async setSchedule(id: string, schedule: ReportSchedule): Promise<Report> {
    const report = await this.reportRepository.findById(id);
    if (!report) {
      throw new Error(`Report with id ${id} not found`);
    }

    report.setSchedule(schedule);
    return this.reportRepository.save(report);
  }

  async removeSchedule(id: string): Promise<Report> {
    const report = await this.reportRepository.findById(id);
    if (!report) {
      throw new Error(`Report with id ${id} not found`);
    }

    report.removeSchedule();
    return this.reportRepository.save(report);
  }

  async delete(id: string): Promise<void> {
    const exists = await this.reportRepository.exists(id);
    if (!exists) {
      throw new Error(`Report with id ${id} not found`);
    }

    return this.reportRepository.delete(id);
  }
}
