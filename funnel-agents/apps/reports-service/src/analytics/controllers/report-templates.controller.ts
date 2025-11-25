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
import { ReportTemplateService } from '../services/report-template.service';
import {
  CreateReportTemplateDto,
  UpdateReportTemplateDto,
  ReportTemplateResponseDto,
  CloneTemplateDto,
} from '../dto/report-template.dto';
import { ReportType } from '../entities/scheduled-report.entity';

@Controller('report-templates')
export class ReportTemplatesController {
  constructor(private readonly templateService: ReportTemplateService) {}

  @Post()
  @MessagePattern({ cmd: 'create_report_template' })
  async create(@Body() dto: CreateReportTemplateDto): Promise<ReportTemplateResponseDto> {
    return this.templateService.create(dto);
  }

  @Get()
  @MessagePattern({ cmd: 'list_report_templates' })
  async findAll(@Query('workspace_id') workspaceId?: string): Promise<ReportTemplateResponseDto[]> {
    return this.templateService.findAll(workspaceId);
  }

  @Get('type/:type')
  @MessagePattern({ cmd: 'list_templates_by_type' })
  async findByType(
    @Param('type') type: ReportType,
    @Query('workspace_id') workspaceId?: string,
  ): Promise<ReportTemplateResponseDto[]> {
    return this.templateService.findByType(type, workspaceId);
  }

  @Get(':id')
  @MessagePattern({ cmd: 'get_report_template' })
  async findOne(
    @Param('id') id: string,
    @Query('workspace_id') workspaceId?: string,
  ): Promise<ReportTemplateResponseDto> {
    return this.templateService.findOne(id, workspaceId);
  }

  @Put(':id')
  @MessagePattern({ cmd: 'update_report_template' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReportTemplateDto,
    @Query('workspace_id') workspaceId?: string,
  ): Promise<ReportTemplateResponseDto> {
    return this.templateService.update(id, dto, workspaceId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @MessagePattern({ cmd: 'delete_report_template' })
  async remove(@Param('id') id: string, @Query('workspace_id') workspaceId?: string): Promise<void> {
    return this.templateService.remove(id, workspaceId);
  }

  @Post('clone')
  @MessagePattern({ cmd: 'clone_report_template' })
  async clone(@Body() dto: CloneTemplateDto): Promise<ReportTemplateResponseDto> {
    return this.templateService.clone(dto);
  }

  @Post('seed')
  @HttpCode(HttpStatus.CREATED)
  @MessagePattern({ cmd: 'seed_default_templates' })
  async seedDefaultTemplates(): Promise<{ message: string }> {
    await this.templateService.seedDefaultTemplates();
    return { message: 'Default templates seeded successfully' };
  }
}
