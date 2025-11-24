import { ContentType } from '@funnelagents/domain';

export class CreateContentCommand {
  constructor(
    public readonly title: string,
    public readonly body: string,
    public readonly type: ContentType,
    public readonly clientId?: string,
    public readonly campaignId?: string,
    public readonly metadata?: {
      seoTitle?: string;
      seoDescription?: string;
      keywords?: string[];
    },
    public readonly tags?: string[]
  ) {}
}

export interface CreateContentResult {
  id: string;
  title: string;
  type: ContentType;
  status: string;
  createdAt: Date;
}
