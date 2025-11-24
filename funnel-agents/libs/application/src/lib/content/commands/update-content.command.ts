export class UpdateContentCommand {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly body: string,
    public readonly notes?: string
  ) {}
}

export interface UpdateContentResult {
  id: string;
  title: string;
  version: number;
  updatedAt: Date;
}
