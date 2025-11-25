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
import { CampaignChannelsService } from '../services/campaign-channels.service';
import {
  CreateCampaignChannelDto,
  UpdateCampaignChannelDto,
  CampaignChannelResponseDto,
} from '../dto/campaign-channel.dto';

@ApiTags('campaign-channels')
@Controller('campaigns/channels')
export class CampaignChannelsController {
  constructor(
    private readonly channelsService: CampaignChannelsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all campaign channels' })
  @ApiResponse({
    status: 200,
    description: 'Channels retrieved successfully',
    type: [CampaignChannelResponseDto],
  })
  @MessagePattern({ cmd: 'campaigns.channels.findAll' })
  async findAll(@Query() query: any) {
    const filters: any = {};
    if (query.campaign_id) filters.campaign_id = query.campaign_id;
    if (query.channel_type) filters.channel_type = query.channel_type;
    if (query.status) filters.status = query.status;

    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key],
    );

    return this.channelsService.findAll(
      Object.keys(filters).length > 0 ? filters : undefined,
      {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
      },
    );
  }

  @Get('campaign/:campaignId')
  @ApiOperation({ summary: 'Get channels by campaign ID' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Channels retrieved successfully',
    type: [CampaignChannelResponseDto],
  })
  @MessagePattern({ cmd: 'campaigns.channels.findByCampaign' })
  async findByCampaignId(@Param('campaignId') campaignId: string) {
    return this.channelsService.findByCampaignId(campaignId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get channel by ID' })
  @ApiParam({ name: 'id', description: 'Channel ID' })
  @ApiResponse({
    status: 200,
    description: 'Channel retrieved successfully',
    type: CampaignChannelResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Channel not found' })
  @MessagePattern({ cmd: 'campaigns.channels.findById' })
  async findById(@Param('id') id: string) {
    return this.channelsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new campaign channel' })
  @ApiResponse({
    status: 201,
    description: 'Channel created successfully',
    type: CampaignChannelResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  @MessagePattern({ cmd: 'campaigns.channels.create' })
  async create(@Body() data: CreateCampaignChannelDto) {
    return this.channelsService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a campaign channel' })
  @ApiParam({ name: 'id', description: 'Channel ID' })
  @ApiResponse({
    status: 200,
    description: 'Channel updated successfully',
    type: CampaignChannelResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Channel not found' })
  @MessagePattern({ cmd: 'campaigns.channels.update' })
  async update(
    @Param('id') id: string,
    @Body() data: UpdateCampaignChannelDto,
  ) {
    return this.channelsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a campaign channel' })
  @ApiParam({ name: 'id', description: 'Channel ID' })
  @ApiResponse({ status: 204, description: 'Channel deleted successfully' })
  @ApiResponse({ status: 404, description: 'Channel not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @MessagePattern({ cmd: 'campaigns.channels.delete' })
  async delete(@Param('id') id: string) {
    await this.channelsService.delete(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a campaign channel' })
  @ApiParam({ name: 'id', description: 'Channel ID' })
  @ApiResponse({
    status: 200,
    description: 'Channel activated',
    type: CampaignChannelResponseDto,
  })
  @MessagePattern({ cmd: 'campaigns.channels.activate' })
  async activate(@Param('id') id: string) {
    return this.channelsService.activateChannel(id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a campaign channel' })
  @ApiParam({ name: 'id', description: 'Channel ID' })
  @ApiResponse({
    status: 200,
    description: 'Channel paused',
    type: CampaignChannelResponseDto,
  })
  @MessagePattern({ cmd: 'campaigns.channels.pause' })
  async pause(@Param('id') id: string) {
    return this.channelsService.pauseChannel(id);
  }
}
