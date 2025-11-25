export class GetClientQuery {
  constructor(public readonly id: string) {}
}

export class GetClientByEmailQuery {
  constructor(public readonly email: string) {}
}

export interface ClientDto {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
