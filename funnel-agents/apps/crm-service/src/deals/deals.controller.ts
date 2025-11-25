import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { UpdateDealStageDto } from './dto/update-deal-stage.dto';
import { FilterDealDto } from './dto/filter-deal.dto';

@Controller()
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @MessagePattern({ cmd: 'deal.findAll' })
  async findAll(@Payload() filters?: FilterDealDto) {
    return this.dealsService.findAll(filters);
  }

  @MessagePattern({ cmd: 'deal.findOne' })
  async findOne(@Payload() id: string) {
    return this.dealsService.findOne(id);
  }

  @MessagePattern({ cmd: 'deal.create' })
  async create(@Payload() createDealDto: CreateDealDto) {
    return this.dealsService.create(createDealDto);
  }

  @MessagePattern({ cmd: 'deal.update' })
  async update(@Payload() payload: { id: string; data: UpdateDealDto }) {
    return this.dealsService.update(payload.id, payload.data);
  }

  @MessagePattern({ cmd: 'deal.remove' })
  async remove(@Payload() id: string) {
    return this.dealsService.remove(id);
  }

  @MessagePattern({ cmd: 'deal.updateStage' })
  async updateStage(
    @Payload() payload: { id: string; data: UpdateDealStageDto },
  ) {
    return this.dealsService.updateStage(payload.id, payload.data);
  }
}
