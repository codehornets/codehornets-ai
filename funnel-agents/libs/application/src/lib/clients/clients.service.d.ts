import { Client, IClientRepository, ClientFilters } from '@funnelagents/domain';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
export declare class ClientsService {
    private readonly clientRepository;
    constructor(clientRepository: IClientRepository);
    findById(id: string): Promise<Client | null>;
    findByEmail(email: string): Promise<Client | null>;
    findAll(params?: PaginationParams): Promise<PaginatedResult<Client>>;
    findWithFilters(filters: ClientFilters, params?: PaginationParams): Promise<PaginatedResult<Client>>;
    create(data: {
        name: string;
        email: string;
        company?: string;
        phone?: string;
        metadata?: Record<string, unknown>;
    }): Promise<Client>;
    update(id: string, data: {
        name?: string;
        email?: string;
        company?: string;
        phone?: string;
        metadata?: Record<string, unknown>;
    }): Promise<Client>;
    activate(id: string): Promise<Client>;
    deactivate(id: string): Promise<Client>;
    archive(id: string): Promise<Client>;
    delete(id: string): Promise<void>;
}
