import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';
import {
  TrackAnalyticsDto,
  QueryAnalyticsDto,
  ContentPerformanceDto,
} from '../dto/analytics.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @UsePipes(new ValidationPipe({ transform: true }))
  async trackEvent(@Body() dto: TrackAnalyticsDto) {
    return this.analyticsService.trackEvent(dto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAnalytics(@Query() query: QueryAnalyticsDto) {
    return this.analyticsService.getAnalytics(query);
  }

  @Get('content/:contentId/metrics')
  async getContentMetrics(@Param('contentId') contentId: string) {
    return this.analyticsService.getContentMetrics(contentId);
  }

  @Get('performance/by-channel')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getPerformanceByChannel(@Query() dto: ContentPerformanceDto) {
    return this.analyticsService.getPerformanceByChannel(dto);
  }

  @Get('performance/top-content')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getTopPerformingContent(@Query() dto: ContentPerformanceDto) {
    return this.analyticsService.getTopPerformingContent(dto);
  }
}
