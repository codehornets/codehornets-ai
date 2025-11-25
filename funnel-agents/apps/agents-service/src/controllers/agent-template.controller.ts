import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { AgentTemplateService } from '@funnelagents/application';
import {
  CreateAgentTemplateDto,
  UpdateAgentTemplateDto,
  AgentTemplateResponseDto,
  AgentTemplateFilterDto,
  PaginationDto,
  ApiResponseDto,
} from '@funnelagents/interfaces';

@Controller('agents/templates')
@ApiTags('agent-templates')
export class AgentTemplateController {
  constructor(private readonly templateService: AgentTemplateService) {}

  @Get()
  @ApiOperation({ summary: 'List all templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  @MessagePattern({ cmd: 'agent.templates.list' })
  async findAll(
    @Query() filters: AgentTemplateFilterDto,
    @Query() pagination: PaginationDto
  ): Promise<ApiResponseDto<AgentTemplateResponseDto[]>> {
    try {
      const templateFilters: any = {};

      if (filters.domain) {
        templateFilters.domain = filters.domain;
      }

      if (filters.category) {
        templateFilters.category = filters.category;
      }

      if (filters.is_public !== undefined) {
        templateFilters.isPublic = filters.is_public;
      }

      if (filters.skill) {
        templateFilters.skills = [filters.skill];
      }

      const result = await this.templateService.findWithFilters(templateFilters, {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder,
      });

      const responseData = result.data.map((template) => this.toResponseDto(template));

      return {
        success: true,
        data: responseData,
        meta: result.meta,
      };
    } catch (error) {
      throw new HttpException(
        { success: false, error: { code: 'FETCH_ERROR', message: error.message } },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @MessagePattern({ cmd: 'agent.templates.get' })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<AgentTemplateResponseDto>> {
    try {
      const template = await this.templateService.findById(id);

      if (!template) {
        throw new HttpException(
          { success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: this.toResponseDto(template),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { success: false, error: { code: 'FETCH_ERROR', message: error.message } },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @MessagePattern({ cmd: 'agent.templates.create' })
  async create(
    @Body() createDto: CreateAgentTemplateDto
  ): Promise<ApiResponseDto<AgentTemplateResponseDto>> {
    try {
      const template = await this.templateService.create({
        name: createDto.name,
        description: createDto.description,
        domain: createDto.domain,
        skills: createDto.skills,
        promptTemplate: createDto.prompt_template,
        defaultSettings: createDto.default_settings,
        category: createDto.category,
        isPublic: createDto.is_public ?? false,
      });

      return {
        success: true,
        data: this.toResponseDto(template),
      };
    } catch (error) {
      throw new HttpException(
        { success: false, error: { code: 'CREATE_ERROR', message: error.message } },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @MessagePattern({ cmd: 'agent.templates.update' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAgentTemplateDto
  ): Promise<ApiResponseDto<AgentTemplateResponseDto>> {
    try {
      const template = await this.templateService.update(id, {
        name: updateDto.name,
        description: updateDto.description,
        domain: updateDto.domain,
        category: updateDto.category,
        skills: updateDto.skills,
        promptTemplate: updateDto.prompt_template,
        defaultSettings: updateDto.default_settings,
      });

      return {
        success: true,
        data: this.toResponseDto(template),
      };
    } catch (error) {
      throw new HttpException(
        { success: false, error: { code: 'UPDATE_ERROR', message: error.message } },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @MessagePattern({ cmd: 'agent.templates.delete' })
  async delete(@Param('id') id: string): Promise<ApiResponseDto<null>> {
    try {
      await this.templateService.delete(id);

      return {
        success: true,
        data: null,
      };
    } catch (error) {
      throw new HttpException(
        { success: false, error: { code: 'DELETE_ERROR', message: error.message } },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  private toResponseDto(template: any): AgentTemplateResponseDto {
    return {
      id: template.id.value,
      name: template.name,
      description: template.description,
      type: template.type,
      domain: template.domain,
      skills: template.skills,
      tools: template.tools,
      prompt_template: template.promptTemplate,
      default_settings: template.defaultSettings,
      category: template.category,
      is_public: template.isPublic,
      persona: template.persona,
      use_cases: template.useCases,
      typical_tasks: template.typicalTasks,
      example_tasks: template.exampleTasks,
      overview: template.overview,
      commonly_used_with: template.commonlyUsedWith,
      popularity_label: template.popularityLabel,
      created_at: template.createdAt,
      updated_at: template.updatedAt,
    };
  }
}
