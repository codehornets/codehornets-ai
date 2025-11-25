import { IRepository, PaginationParams, PaginatedResult } from '../shared-kernel';
import { Content } from './content.entity';
import { ContentType, ContentStatus } from './content.types';
export interface ContentFilters {
    type?: ContentType;
    status?: ContentStatus;
    clientId?: string;
    campaignId?: string;
    tags?: string[];
    search?: string;
}
export interface IContentRepository extends IRepository<Content> {
    findByType(type: ContentType, params?: PaginationParams): Promise<PaginatedResult<Content>>;
    findByStatus(status: ContentStatus, params?: PaginationParams): Promise<PaginatedResult<Content>>;
    findByCampaign(campaignId: string, params?: PaginationParams): Promise<PaginatedResult<Content>>;
    findWithFilters(filters: ContentFilters, params?: PaginationParams): Promise<PaginatedResult<Content>>;
}
