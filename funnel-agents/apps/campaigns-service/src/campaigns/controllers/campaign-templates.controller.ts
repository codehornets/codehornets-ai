import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CampaignTemplatesService } from '../services/campaign-templates.service';
import {
  CreateCampaignTemplateDto,
  UpdateCampaignTemplateDto,
  CampaignTemplateResponseDto,
} from '../dto/campaign-template.dto';
import { CampaignTemplateQueryDto } from '../dto/query.dto';

@ApiTags('campaign-templates')
@Controller('campaign-templates')
export class CampaignTemplatesController {
  constructor(
    private readonly templatesService: CampaignTemplatesService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all campaign templates' })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
    type: [CampaignTemplateResponseDto],
  })
  @MessagePattern({ cmd: 'campaign-templates.findAll' })
  async findAll(@Query() query: CampaignTemplateQueryDto) {
    const filters: Record<string, any> = {
      category: query.category,
      is_public: query.is_public,
      search: query.search,
    };

    // Remove undefined values
    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key]
    );

    return this.templatesService.findAll(
      filters,
      {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder
      }
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Template retrieved successfully',
    type: CampaignTemplateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @MessagePattern({ cmd: 'campaign-templates.findById' })
  async findById(@Param('id') id: string) {
    return this.templatesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new campaign template' })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
    type: CampaignTemplateResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  @MessagePattern({ cmd: 'campaign-templates.create' })
  async create(@Body() data: CreateCampaignTemplateDto) {
    return this.templatesService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a campaign template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Template updated successfully',
    type: CampaignTemplateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @MessagePattern({ cmd: 'campaign-templates.update' })
  async update(
    @Param('id') id: string,
    @Body() data: UpdateCampaignTemplateDto
  ) {
    return this.templatesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a campaign template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: 204, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @MessagePattern({ cmd: 'campaign-templates.delete' })
  async delete(@Param('id') id: string) {
    await this.templatesService.delete(id);
  }
}
