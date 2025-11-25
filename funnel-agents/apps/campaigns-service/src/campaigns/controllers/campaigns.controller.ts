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
import { CampaignsService } from '../services/campaigns.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignResponseDto,
  CreateFromTemplateDto,
} from '../dto/campaign.dto';
import { CampaignQueryDto } from '../dto/query.dto';

@ApiTags('campaigns')
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  @ApiOperation({ summary: 'List all campaigns' })
  @ApiResponse({
    status: 200,
    description: 'Campaigns retrieved successfully',
    type: [CampaignResponseDto],
  })
  @MessagePattern({ cmd: 'campaigns.findAll' })
  async findAll(@Query() query: CampaignQueryDto) {
    const filters: Record<string, any> = {
      workspace_id: query.workspace_id,
      status: query.status,
      priority: query.priority,
      search: query.search,
    };

    // Remove undefined values
    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key]
    );

    return this.campaignsService.findAll(
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
  @ApiOperation({ summary: 'Get campaign by ID' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign retrieved successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @MessagePattern({ cmd: 'campaigns.findById' })
  async findById(@Param('id') id: string) {
    return this.campaignsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({
    status: 201,
    description: 'Campaign created successfully',
    type: CampaignResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  @MessagePattern({ cmd: 'campaigns.create' })
  async create(@Body() data: CreateCampaignDto) {
    return this.campaignsService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign updated successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @MessagePattern({ cmd: 'campaigns.update' })
  async update(
    @Param('id') id: string,
    @Body() data: UpdateCampaignDto
  ) {
    return this.campaignsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({ status: 204, description: 'Campaign deleted successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @MessagePattern({ cmd: 'campaigns.delete' })
  async delete(@Param('id') id: string) {
    await this.campaignsService.delete(id);
  }

  @Post('from-template')
  @ApiOperation({ summary: 'Create campaign from template' })
  @ApiResponse({
    status: 201,
    description: 'Campaign created from template successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @HttpCode(HttpStatus.CREATED)
  @MessagePattern({ cmd: 'campaigns.createFromTemplate' })
  async createFromTemplate(@Body() data: CreateFromTemplateDto) {
    return this.campaignsService.createFromTemplate(data);
  }
}
