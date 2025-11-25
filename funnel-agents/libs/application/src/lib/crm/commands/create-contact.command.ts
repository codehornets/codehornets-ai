import { LeadSource } from '@funnelagents/domain';

export class CreateContactCommand {
  constructor(
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly source: LeadSource,
    public readonly phone?: string,
    public readonly company?: string,
    public readonly jobTitle?: string,
    public readonly tags?: string[]
  ) {}
}

export interface CreateContactResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  source: LeadSource;
  createdAt: Date;
}
