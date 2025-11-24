export class CreateClientCommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly company?: string,
    public readonly phone?: string,
    public readonly metadata?: Record<string, unknown>
  ) {}
}

export interface CreateClientResult {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  createdAt: Date;
}
