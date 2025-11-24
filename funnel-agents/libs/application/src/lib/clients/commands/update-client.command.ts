export class UpdateClientCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly email?: string,
    public readonly company?: string,
    public readonly phone?: string,
    public readonly metadata?: Record<string, unknown>
  ) {}
}

export interface UpdateClientResult {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  updatedAt: Date;
}
