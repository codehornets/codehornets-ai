import { Repository } from 'typeorm';
import { ContentVersion } from '../entities/content-version.entity';
import { Content } from '../entities/content.entity';
export declare class VersionService {
    private readonly versionRepository;
    private readonly contentRepository;
    constructor(versionRepository: Repository<ContentVersion>, contentRepository: Repository<Content>);
    createVersion(contentId: string, changeSummary?: string, changedBy?: string): Promise<ContentVersion>;
    getVersionHistory(contentId: string): Promise<ContentVersion[]>;
    getVersion(versionId: string): Promise<ContentVersion>;
    compareVersions(version1Id: string, version2Id: string): Promise<{
        version1: ContentVersion;
        version2: ContentVersion;
        diff: {
            title?: any[];
            description?: any[];
            body?: any[];
        };
    }>;
    rollbackToVersion(contentId: string, versionId: string, rollbackReason?: string, userId?: string): Promise<Content>;
    deleteVersion(versionId: string): Promise<void>;
}
