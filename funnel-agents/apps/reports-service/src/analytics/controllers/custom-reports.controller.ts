import { Controller, Post, Body } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CustomReportService } from '../services/custom-report.service';
import { CustomReportDto, CustomReportResultDto } from '../dto/custom-report.dto';

@Controller('analytics/custom')
export class CustomReportsController {
  constructor(private readonly customReportService: CustomReportService) {}

  @Post()
  @MessagePattern({ cmd: 'generate_custom_report' })
  async generateCustomReport(@Body() dto: CustomReportDto): Promise<CustomReportResultDto> {
    return this.customReportService.generateCustomReport(dto);
  }
}
