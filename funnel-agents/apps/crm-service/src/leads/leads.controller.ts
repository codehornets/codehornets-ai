import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { FilterLeadDto } from './dto/filter-lead.dto';

@Controller()
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @MessagePattern({ cmd: 'lead.findAll' })
  async findAll(@Payload() filters?: FilterLeadDto) {
    return this.leadsService.findAll(filters);
  }

  @MessagePattern({ cmd: 'lead.findOne' })
  async findOne(@Payload() id: string) {
    return this.leadsService.findOne(id);
  }

  @MessagePattern({ cmd: 'lead.create' })
  async create(@Payload() createLeadDto: CreateLeadDto) {
    return this.leadsService.create(createLeadDto);
  }

  @MessagePattern({ cmd: 'lead.update' })
  async update(@Payload() payload: { id: string; data: UpdateLeadDto }) {
    return this.leadsService.update(payload.id, payload.data);
  }

  @MessagePattern({ cmd: 'lead.remove' })
  async remove(@Payload() id: string) {
    return this.leadsService.remove(id);
  }

  @MessagePattern({ cmd: 'lead.qualify' })
  async qualify(@Payload() id: string) {
    return this.leadsService.qualify(id);
  }

  @MessagePattern({ cmd: 'lead.convert' })
  async convert(@Payload() id: string) {
    return this.leadsService.convert(id);
  }
}
