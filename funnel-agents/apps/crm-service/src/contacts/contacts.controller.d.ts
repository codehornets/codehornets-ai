import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { FilterContactDto } from './dto/filter-contact.dto';
export declare class ContactsController {
    private readonly contactsService;
    constructor(contactsService: ContactsService);
    findAll(filters?: FilterContactDto): Promise<{
        data: import("./contact.entity").Contact[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<import("./contact.entity").Contact>;
    create(createContactDto: CreateContactDto): Promise<import("./contact.entity").Contact>;
    update(payload: {
        id: string;
        data: UpdateContactDto;
    }): Promise<import("./contact.entity").Contact>;
    remove(id: string): Promise<void>;
}
