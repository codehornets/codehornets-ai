import { Repository } from 'typeorm';
import { Contact } from './contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { FilterContactDto } from './dto/filter-contact.dto';
export declare class ContactsService {
    private contactsRepository;
    constructor(contactsRepository: Repository<Contact>);
    findAll(filters?: FilterContactDto): Promise<{
        data: Contact[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Contact>;
    create(createContactDto: CreateContactDto): Promise<Contact>;
    update(id: string, updateContactDto: UpdateContactDto): Promise<Contact>;
    remove(id: string): Promise<void>;
}
