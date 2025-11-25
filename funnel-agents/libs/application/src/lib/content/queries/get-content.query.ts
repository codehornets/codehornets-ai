import { ContentType, ContentStatus, ContentVersion, ContentMetadata } from '@funnelagents/domain';

export class GetContentQuery {
  constructor(public readonly id: string) {}
}

export interface ContentDto {
  id: string;
  title: string;
  body: string;
  type: ContentType;
  status: ContentStatus;
  clientId?: string;
  campaignId?: string;
  metadata?: ContentMetadata;
  versions: ContentVersion[];
  currentVersion: number;
  tags: string[];
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
