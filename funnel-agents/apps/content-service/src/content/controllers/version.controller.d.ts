import { VersionService } from '../services/version.service';
import { CreateVersionDto, VersionCompareDto, RollbackVersionDto } from '../dto/version.dto';
export declare class VersionController {
    private readonly versionService;
    constructor(versionService: VersionService);
    createVersion(contentId: string, dto: CreateVersionDto): Promise<import("../entities/content-version.entity").ContentVersion>;
    getVersionHistory(contentId: string): Promise<import("../entities/content-version.entity").ContentVersion[]>;
    getVersion(versionId: string): Promise<import("../entities/content-version.entity").ContentVersion>;
    compareVersions(dto: VersionCompareDto): Promise<{
        version1: import("../entities/content-version.entity").ContentVersion;
        version2: import("../entities/content-version.entity").ContentVersion;
        diff: {
            title?: any[];
            description?: any[];
            body?: any[];
        };
    }>;
    rollbackToVersion(contentId: string, dto: RollbackVersionDto): Promise<import("../entities/content.entity").Content>;
    deleteVersion(versionId: string): Promise<{
        success: boolean;
    }>;
}
