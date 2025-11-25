import { Content, IContentRepository, ContentFilters, ContentType } from '@funnelagents/domain';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
export declare class ContentService {
    private readonly contentRepository;
    constructor(contentRepository: IContentRepository);
    findById(id: string): Promise<Content | null>;
    findAll(params?: PaginationParams): Promise<PaginatedResult<Content>>;
    findWithFilters(filters: ContentFilters, params?: PaginationParams): Promise<PaginatedResult<Content>>;
    create(data: {
        title: string;
        body: string;
        type: ContentType;
        clientId?: string;
        campaignId?: string;
        metadata?: {
            seoTitle?: string;
            seoDescription?: string;
            keywords?: string[];
        };
        tags?: string[];
    }): Promise<Content>;
    update(id: string, title: string, body: string, notes?: string): Promise<Content>;
    submitForReview(id: string): Promise<Content>;
    approve(id: string): Promise<Content>;
    publish(id: string): Promise<Content>;
    archive(id: string): Promise<Content>;
    delete(id: string): Promise<void>;
}
