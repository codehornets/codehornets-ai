import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { FilterContactDto } from './dto/filter-contact.dto';

@Controller()
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @MessagePattern({ cmd: 'contact.findAll' })
  async findAll(@Payload() filters?: FilterContactDto) {
    return this.contactsService.findAll(filters);
  }

  @MessagePattern({ cmd: 'contact.findOne' })
  async findOne(@Payload() id: string) {
    return this.contactsService.findOne(id);
  }

  @MessagePattern({ cmd: 'contact.create' })
  async create(@Payload() createContactDto: CreateContactDto) {
    return this.contactsService.create(createContactDto);
  }

  @MessagePattern({ cmd: 'contact.update' })
  async update(@Payload() payload: { id: string; data: UpdateContactDto }) {
    return this.contactsService.update(payload.id, payload.data);
  }

  @MessagePattern({ cmd: 'contact.remove' })
  async remove(@Payload() id: string) {
    return this.contactsService.remove(id);
  }
}
