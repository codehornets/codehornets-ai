import { ContactStatus, LeadSource, ContactInteraction } from '@funnelagents/domain';

export class GetContactQuery {
  constructor(public readonly id: string) {}
}

export class GetContactByEmailQuery {
  constructor(public readonly email: string) {}
}

export interface ContactDto {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status: ContactStatus;
  source: LeadSource;
  score: number;
  tags: string[];
  interactions: ContactInteraction[];
  createdAt: Date;
  updatedAt: Date;
}
