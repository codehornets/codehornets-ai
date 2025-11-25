import { ContentType, ContentStatus, ContentVersion, ContentMetadata } from '@funnelagents/domain';
export declare class GetContentQuery {
    readonly id: string;
    constructor(id: string);
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
