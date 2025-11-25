import { Contact, IContactRepository, ContactFilters, ContactStatus, LeadSource } from '@funnelagents/domain';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
export declare class ContactsService {
    private readonly contactRepository;
    constructor(contactRepository: IContactRepository);
    findById(id: string): Promise<Contact | null>;
    findByEmail(email: string): Promise<Contact | null>;
    findAll(params?: PaginationParams): Promise<PaginatedResult<Contact>>;
    findWithFilters(filters: ContactFilters, params?: PaginationParams): Promise<PaginatedResult<Contact>>;
    create(data: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        company?: string;
        jobTitle?: string;
        source: LeadSource;
        tags?: string[];
    }): Promise<Contact>;
    updateStatus(id: string, status: ContactStatus): Promise<Contact>;
    updateScore(id: string, score: number): Promise<Contact>;
    addInteraction(id: string, interaction: {
        type: 'email' | 'call' | 'meeting' | 'note';
        subject: string;
        content?: string;
        userId?: string;
    }): Promise<Contact>;
    delete(id: string): Promise<void>;
}
