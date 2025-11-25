import { PaginationParams, ContentType, ContentStatus } from '@funnelagents/domain';
export declare class ListContentQuery {
    readonly filters?: {
        type?: ContentType;
        status?: ContentStatus;
        clientId?: string;
        campaignId?: string;
        tags?: string[];
        search?: string;
    } | undefined;
    readonly pagination?: PaginationParams | undefined;
    constructor(filters?: {
        type?: ContentType;
        status?: ContentStatus;
        clientId?: string;
        campaignId?: string;
        tags?: string[];
        search?: string;
    } | undefined, pagination?: PaginationParams | undefined);
}
export interface ContentListDto {
    id: string;
    title: string;
    type: ContentType;
    status: ContentStatus;
    currentVersion: number;
    createdAt: Date;
}
