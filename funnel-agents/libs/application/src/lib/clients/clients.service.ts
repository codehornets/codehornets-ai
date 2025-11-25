import { Injectable } from '@nestjs/common';
import {
  Client,
  IClientRepository,
  ClientFilters,
  Email,
} from '@funnelagents/domain';
import { PaginationParams, PaginatedResult, UniqueId } from '@funnelagents/domain';

@Injectable()
export class ClientsService {
  constructor(private readonly clientRepository: IClientRepository) {}

  async findById(id: string): Promise<Client | null> {
    return this.clientRepository.findById(id);
  }

  async findByEmail(email: string): Promise<Client | null> {
    return this.clientRepository.findByEmail(email);
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<Client>> {
    return this.clientRepository.findAll(params);
  }

  async findWithFilters(
    filters: ClientFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<Client>> {
    return this.clientRepository.findWithFilters(filters, params);
  }

  async create(data: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Client> {
    const existingClient = await this.clientRepository.findByEmail(data.email);
    if (existingClient) {
      throw new Error(`Client with email ${data.email} already exists`);
    }

    const client = Client.create({
      name: data.name,
      email: Email.create(data.email),
      company: data.company,
      phone: data.phone,
      metadata: data.metadata,
    });

    return this.clientRepository.save(client);
  }

  async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      company?: string;
      phone?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Client> {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new Error(`Client with id ${id} not found`);
    }

    client.update({
      name: data.name,
      email: data.email ? Email.create(data.email) : undefined,
      company: data.company,
      phone: data.phone,
      metadata: data.metadata,
    });

    return this.clientRepository.save(client);
  }

  async activate(id: string): Promise<Client> {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new Error(`Client with id ${id} not found`);
    }

    client.activate();
    return this.clientRepository.save(client);
  }

  async deactivate(id: string): Promise<Client> {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new Error(`Client with id ${id} not found`);
    }

    client.deactivate();
    return this.clientRepository.save(client);
  }

  async archive(id: string): Promise<Client> {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new Error(`Client with id ${id} not found`);
    }

    client.archive();
    return this.clientRepository.save(client);
  }

  async delete(id: string): Promise<void> {
    const exists = await this.clientRepository.exists(id);
    if (!exists) {
      throw new Error(`Client with id ${id} not found`);
    }

    return this.clientRepository.delete(id);
  }
}
