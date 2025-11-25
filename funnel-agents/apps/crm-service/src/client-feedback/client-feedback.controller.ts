import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ClientFeedbackService } from './client-feedback.service';
import { CreateClientFeedbackDto } from './dto/create-client-feedback.dto';
import { UpdateClientFeedbackDto } from './dto/update-client-feedback.dto';
import { FilterClientFeedbackDto } from './dto/filter-client-feedback.dto';

@Controller()
export class ClientFeedbackController {
  constructor(
    private readonly clientFeedbackService: ClientFeedbackService,
  ) {}

  @MessagePattern({ cmd: 'clientFeedback.findAll' })
  async findAll(@Payload() filters?: FilterClientFeedbackDto) {
    return this.clientFeedbackService.findAll(filters);
  }

  @MessagePattern({ cmd: 'clientFeedback.findOne' })
  async findOne(@Payload() id: string) {
    return this.clientFeedbackService.findOne(id);
  }

  @MessagePattern({ cmd: 'clientFeedback.create' })
  async create(@Payload() createClientFeedbackDto: CreateClientFeedbackDto) {
    return this.clientFeedbackService.create(createClientFeedbackDto);
  }

  @MessagePattern({ cmd: 'clientFeedback.update' })
  async update(
    @Payload() payload: { id: string; data: UpdateClientFeedbackDto },
  ) {
    return this.clientFeedbackService.update(payload.id, payload.data);
  }

  @MessagePattern({ cmd: 'clientFeedback.remove' })
  async remove(@Payload() id: string) {
    return this.clientFeedbackService.remove(id);
  }
}
