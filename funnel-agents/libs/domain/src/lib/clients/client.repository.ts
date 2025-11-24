import { IRepository, PaginationParams, PaginatedResult } from '../shared-kernel';
import { Client } from './client.entity';

export interface ClientFilters {
  status?: string;
  company?: string;
  search?: string;
}

export interface IClientRepository extends IRepository<Client> {
  findByEmail(email: string): Promise<Client | null>;
  findByCompany(company: string, params?: PaginationParams): Promise<PaginatedResult<Client>>;
  findWithFilters(filters: ClientFilters, params?: PaginationParams): Promise<PaginatedResult<Client>>;
}
