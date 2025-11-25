import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { CampaignSchedulingService } from '../services/campaign-scheduling.service';
import {
  CreateCampaignScheduleDto,
  UpdateCampaignScheduleDto,
  CampaignScheduleResponseDto,
} from '../dto/campaign-schedule.dto';

@ApiTags('campaign-scheduling')
@Controller('campaigns/schedules')
export class CampaignSchedulingController {
  constructor(
    private readonly schedulingService: CampaignSchedulingService,
  ) {}

  @Get('campaign/:campaignId')
  @ApiOperation({ summary: 'Get schedule by campaign ID' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Schedule retrieved successfully',
    type: CampaignScheduleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  @MessagePattern({ cmd: 'campaigns.schedules.findByCampaign' })
  async findByCampaignId(@Param('campaignId') campaignId: string) {
    return this.schedulingService.findByCampaignId(campaignId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a campaign schedule' })
  @ApiResponse({
    status: 201,
    description: 'Schedule created successfully',
    type: CampaignScheduleResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  @MessagePattern({ cmd: 'campaigns.schedules.create' })
  async create(@Body() data: CreateCampaignScheduleDto) {
    return this.schedulingService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a campaign schedule' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({
    status: 200,
    description: 'Schedule updated successfully',
    type: CampaignScheduleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  @MessagePattern({ cmd: 'campaigns.schedules.update' })
  async update(
    @Param('id') id: string,
    @Body() data: UpdateCampaignScheduleDto,
  ) {
    return this.schedulingService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a campaign schedule' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: 204, description: 'Schedule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @MessagePattern({ cmd: 'campaigns.schedules.delete' })
  async delete(@Param('id') id: string) {
    await this.schedulingService.delete(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a campaign schedule' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({
    status: 200,
    description: 'Schedule activated',
    type: CampaignScheduleResponseDto,
  })
  @MessagePattern({ cmd: 'campaigns.schedules.activate' })
  async activate(@Param('id') id: string) {
    return this.schedulingService.activateSchedule(id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a campaign schedule' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({
    status: 200,
    description: 'Schedule paused',
    type: CampaignScheduleResponseDto,
  })
  @MessagePattern({ cmd: 'campaigns.schedules.pause' })
  async pause(@Param('id') id: string) {
    return this.schedulingService.pauseSchedule(id);
  }
}
