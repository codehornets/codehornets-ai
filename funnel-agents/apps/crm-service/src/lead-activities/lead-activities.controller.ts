import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LeadActivitiesService } from './lead-activities.service';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { FilterLeadActivityDto } from './dto/filter-lead-activity.dto';

@Controller()
export class LeadActivitiesController {
  constructor(
    private readonly leadActivitiesService: LeadActivitiesService,
  ) {}

  @MessagePattern({ cmd: 'leadActivity.findAll' })
  async findAll(@Payload() filters?: FilterLeadActivityDto) {
    return this.leadActivitiesService.findAll(filters);
  }

  @MessagePattern({ cmd: 'leadActivity.findOne' })
  async findOne(@Payload() id: string) {
    return this.leadActivitiesService.findOne(id);
  }

  @MessagePattern({ cmd: 'leadActivity.create' })
  async create(@Payload() createLeadActivityDto: CreateLeadActivityDto) {
    return this.leadActivitiesService.create(createLeadActivityDto);
  }

  @MessagePattern({ cmd: 'leadActivity.findByLeadId' })
  async findByLeadId(@Payload() leadId: string) {
    return this.leadActivitiesService.findByLeadId(leadId);
  }
}
