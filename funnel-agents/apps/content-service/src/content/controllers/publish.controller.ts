import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { PublishService } from '../services/publish.service';
import {
  SchedulePublishDto,
  UpdatePublishStatusDto,
  CancelPublishDto,
} from '../dto/publish.dto';

@Controller('content')
export class PublishController {
  constructor(private readonly publishService: PublishService) {}

  @Post('publishes')
  @UsePipes(new ValidationPipe({ transform: true }))
  async schedulePublish(@Body() dto: SchedulePublishDto) {
    return this.publishService.schedulePublish(dto);
  }

  @Patch('publishes/:publishId/status')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updatePublishStatus(
    @Param('publishId') publishId: string,
    @Body() dto: UpdatePublishStatusDto,
  ) {
    return this.publishService.updatePublishStatus(publishId, dto);
  }

  @Post('publishes/:publishId/cancel')
  @UsePipes(new ValidationPipe({ transform: true }))
  async cancelPublish(
    @Param('publishId') publishId: string,
    @Body() dto: CancelPublishDto,
  ) {
    return this.publishService.cancelPublish(publishId, dto);
  }

  @Get(':contentId/publishes')
  async getContentPublishes(@Param('contentId') contentId: string) {
    return this.publishService.getContentPublishes(contentId);
  }

  @Get('publishes/scheduled')
  async getScheduledPublishes(@Query('limit') limit?: number) {
    return this.publishService.getScheduledPublishes(limit);
  }

  @Get('publishes/upcoming')
  async getUpcomingPublishes(@Query('limit') limit?: number) {
    return this.publishService.getUpcomingPublishes(limit);
  }

  @Get('publishes/:publishId')
  async getPublishById(@Param('publishId') publishId: string) {
    return this.publishService.getPublishById(publishId);
  }

  @Delete('publishes/:publishId')
  async deletePublish(@Param('publishId') publishId: string) {
    await this.publishService.deletePublish(publishId);
    return { success: true };
  }
}
