import { ContactStatus } from '@funnelagents/domain';

export class UpdateContactCommand {
  constructor(
    public readonly id: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly phone?: string,
    public readonly company?: string,
    public readonly jobTitle?: string,
    public readonly status?: ContactStatus,
    public readonly score?: number,
    public readonly tags?: string[]
  ) {}
}

export interface UpdateContactResult {
  id: string;
  fullName: string;
  status: string;
  score: number;
  updatedAt: Date;
}
