import { PaginationParams } from '@funnelagents/domain';

export class ListClientsQuery {
  constructor(
    public readonly filters?: {
      status?: string;
      company?: string;
      search?: string;
    },
    public readonly pagination?: PaginationParams
  ) {}
}

export interface ClientListDto {
  id: string;
  name: string;
  email: string;
  company?: string;
  status: string;
  createdAt: Date;
}
