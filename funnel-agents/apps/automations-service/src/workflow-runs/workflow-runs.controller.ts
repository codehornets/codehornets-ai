import { Controller, Get, Post, Param, Body, Query, ValidationPipe } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { WorkflowRunsService } from './workflow-runs.service';
import { CreateWorkflowRunDto } from './dto/create-workflow-run.dto';
import { WorkflowRunFilters } from './workflow-runs.repository';

@Controller('workflow-runs')
export class WorkflowRunsController {
  constructor(private readonly workflowRunsService: WorkflowRunsService) {}

  @MessagePattern({ cmd: 'workflowRuns.findAll' })
  @Get()
  async findAll(@Query() filters?: WorkflowRunFilters) {
    return this.workflowRunsService.findAll(filters);
  }

  @MessagePattern({ cmd: 'workflowRuns.findById' })
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.workflowRunsService.findById(id);
  }

  @MessagePattern({ cmd: 'workflowRuns.create' })
  @Post()
  async create(@Body(ValidationPipe) createDto: CreateWorkflowRunDto) {
    return this.workflowRunsService.create(createDto);
  }
}
