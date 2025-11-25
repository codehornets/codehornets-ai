import {
  Controller,
  Get,
  Post,
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
import { CampaignAnalyticsService } from '../services/campaign-analytics.service';
import {
  CreateAnalyticEventDto,
  CampaignAnalyticsQueryDto,
  CampaignPerformanceDto,
} from '../dto/campaign-analytics.dto';

@ApiTags('campaign-analytics')
@Controller('campaigns/analytics')
export class CampaignAnalyticsController {
  constructor(
    private readonly analyticsService: CampaignAnalyticsService,
  ) {}

  @Post('track')
  @ApiOperation({ summary: 'Track an analytics event' })
  @ApiResponse({
    status: 201,
    description: 'Event tracked successfully',
  })
  @HttpCode(HttpStatus.CREATED)
  @MessagePattern({ cmd: 'campaigns.analytics.track' })
  async trackEvent(@Body() data: CreateAnalyticEventDto) {
    return this.analyticsService.trackEvent(data);
  }

  @Get('performance/:campaignId')
  @ApiOperation({ summary: 'Get campaign performance metrics' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics retrieved',
    type: CampaignPerformanceDto,
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @MessagePattern({ cmd: 'campaigns.analytics.performance' })
  async getCampaignPerformance(
    @Param('campaignId') campaignId: string,
    @Query() query: CampaignAnalyticsQueryDto,
  ) {
    const startDate = query.start_date ? new Date(query.start_date) : undefined;
    const endDate = query.end_date ? new Date(query.end_date) : undefined;

    return this.analyticsService.getCampaignPerformance(
      campaignId,
      startDate,
      endDate,
    );
  }
}
