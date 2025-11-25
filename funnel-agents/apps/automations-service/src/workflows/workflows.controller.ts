import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { ExecuteWorkflowDto } from './dto/execute-workflow.dto';
import { WorkflowFilters } from './workflows.repository';

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @MessagePattern({ cmd: 'workflows.findAll' })
  @Get()
  async findAll(@Query() filters?: WorkflowFilters) {
    return this.workflowsService.findAll(filters);
  }

  @MessagePattern({ cmd: 'workflows.findById' })
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.workflowsService.findById(id);
  }

  @MessagePattern({ cmd: 'workflows.create' })
  @Post()
  async create(@Body(ValidationPipe) createDto: CreateWorkflowDto) {
    return this.workflowsService.create(createDto);
  }

  @MessagePattern({ cmd: 'workflows.update' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateWorkflowDto
  ) {
    return this.workflowsService.update(id, updateDto);
  }

  @MessagePattern({ cmd: 'workflows.delete' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.workflowsService.delete(id);
  }

  @MessagePattern({ cmd: 'workflows.execute' })
  @Post(':id/execute')
  async execute(
    @Param('id') id: string,
    @Body(ValidationPipe) executeDto: ExecuteWorkflowDto
  ) {
    return this.workflowsService.execute(id, executeDto);
  }

  @MessagePattern({ cmd: 'workflows.validate' })
  @Get(':id/validate')
  async validate(@Param('id') id: string) {
    return this.workflowsService.validate(id);
  }

  @MessagePattern({ cmd: 'workflows.activate' })
  @Post(':id/activate')
  async activate(@Param('id') id: string) {
    return this.workflowsService.activate(id);
  }

  @MessagePattern({ cmd: 'workflows.pause' })
  @Post(':id/pause')
  async pause(@Param('id') id: string) {
    return this.workflowsService.pause(id);
  }

  @MessagePattern({ cmd: 'workflows.archive' })
  @Post(':id/archive')
  async archive(@Param('id') id: string) {
    return this.workflowsService.archive(id);
  }
}
