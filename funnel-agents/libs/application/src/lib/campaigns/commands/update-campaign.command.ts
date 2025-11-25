export class UpdateCampaignCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly budget?: { amount: number; currency: string },
    public readonly dateRange?: { start: Date; end: Date }
  ) {}
}

export interface UpdateCampaignResult {
  id: string;
  name: string;
  updatedAt: Date;
}
