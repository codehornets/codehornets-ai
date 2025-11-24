import { PaginationParams, ContactStatus, LeadSource } from '@funnelagents/domain';

export class ListContactsQuery {
  constructor(
    public readonly filters?: {
      status?: ContactStatus;
      source?: LeadSource;
      tags?: string[];
      search?: string;
      scoreMin?: number;
      scoreMax?: number;
    },
    public readonly pagination?: PaginationParams
  ) {}
}

export interface ContactListDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  status: ContactStatus;
  score: number;
  createdAt: Date;
}
