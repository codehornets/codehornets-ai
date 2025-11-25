import { IRepository, PaginationParams, PaginatedResult } from '../shared-kernel';
import { Contact } from './contact.entity';
import { ContactStatus, LeadSource } from './crm.types';

export interface ContactFilters {
  status?: ContactStatus;
  source?: LeadSource;
  tags?: string[];
  search?: string;
  scoreMin?: number;
  scoreMax?: number;
}

export interface IContactRepository extends IRepository<Contact> {
  findByEmail(email: string): Promise<Contact | null>;
  findByStatus(status: ContactStatus, params?: PaginationParams): Promise<PaginatedResult<Contact>>;
  findByTags(tags: string[], params?: PaginationParams): Promise<PaginatedResult<Contact>>;
  findWithFilters(filters: ContactFilters, params?: PaginationParams): Promise<PaginatedResult<Contact>>;
  findHighValueLeads(minScore: number): Promise<Contact[]>;
}
