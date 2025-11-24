import { Injectable } from '@nestjs/common';
import {
  Contact,
  IContactRepository,
  ContactFilters,
  ContactStatus,
  LeadSource,
  Email,
} from '@funnelagents/domain';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';

@Injectable()
export class ContactsService {
  constructor(private readonly contactRepository: IContactRepository) {}

  async findById(id: string): Promise<Contact | null> {
    return this.contactRepository.findById(id);
  }

  async findByEmail(email: string): Promise<Contact | null> {
    return this.contactRepository.findByEmail(email);
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<Contact>> {
    return this.contactRepository.findAll(params);
  }

  async findWithFilters(
    filters: ContactFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<Contact>> {
    return this.contactRepository.findWithFilters(filters, params);
  }

  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    source: LeadSource;
    tags?: string[];
  }): Promise<Contact> {
    const existingContact = await this.contactRepository.findByEmail(data.email);
    if (existingContact) {
      throw new Error(`Contact with email ${data.email} already exists`);
    }

    const contact = Contact.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: Email.create(data.email),
      phone: data.phone,
      company: data.company,
      jobTitle: data.jobTitle,
      source: data.source,
      tags: data.tags,
    });

    return this.contactRepository.save(contact);
  }

  async updateStatus(id: string, status: ContactStatus): Promise<Contact> {
    const contact = await this.contactRepository.findById(id);
    if (!contact) {
      throw new Error(`Contact with id ${id} not found`);
    }

    contact.updateStatus(status);
    return this.contactRepository.save(contact);
  }

  async updateScore(id: string, score: number): Promise<Contact> {
    const contact = await this.contactRepository.findById(id);
    if (!contact) {
      throw new Error(`Contact with id ${id} not found`);
    }

    contact.updateScore(score);
    return this.contactRepository.save(contact);
  }

  async addInteraction(
    id: string,
    interaction: {
      type: 'email' | 'call' | 'meeting' | 'note';
      subject: string;
      content?: string;
      userId?: string;
    }
  ): Promise<Contact> {
    const contact = await this.contactRepository.findById(id);
    if (!contact) {
      throw new Error(`Contact with id ${id} not found`);
    }

    contact.addInteraction(interaction);
    return this.contactRepository.save(contact);
  }

  async delete(id: string): Promise<void> {
    const exists = await this.contactRepository.exists(id);
    if (!exists) {
      throw new Error(`Contact with id ${id} not found`);
    }

    return this.contactRepository.delete(id);
  }
}
