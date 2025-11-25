import { ContentType } from '@funnelagents/domain';
export declare class CreateContentCommand {
    readonly title: string;
    readonly body: string;
    readonly type: ContentType;
    readonly clientId?: string | undefined;
    readonly campaignId?: string | undefined;
    readonly metadata?: {
        seoTitle?: string;
        seoDescription?: string;
        keywords?: string[];
    } | undefined;
    readonly tags?: string[] | undefined;
    constructor(title: string, body: string, type: ContentType, clientId?: string | undefined, campaignId?: string | undefined, metadata?: {
        seoTitle?: string;
        seoDescription?: string;
        keywords?: string[];
    } | undefined, tags?: string[] | undefined);
}
export interface CreateContentResult {
    id: string;
    title: string;
    type: ContentType;
    status: string;
    createdAt: Date;
}
