import { PublishService } from '../services/publish.service';
import { SchedulePublishDto, UpdatePublishStatusDto, CancelPublishDto } from '../dto/publish.dto';
export declare class PublishController {
    private readonly publishService;
    constructor(publishService: PublishService);
    schedulePublish(dto: SchedulePublishDto): Promise<import("../entities/content-publish.entity").ContentPublish>;
    updatePublishStatus(publishId: string, dto: UpdatePublishStatusDto): Promise<import("../entities/content-publish.entity").ContentPublish>;
    cancelPublish(publishId: string, dto: CancelPublishDto): Promise<import("../entities/content-publish.entity").ContentPublish>;
    getContentPublishes(contentId: string): Promise<import("../entities/content-publish.entity").ContentPublish[]>;
    getScheduledPublishes(limit?: number): Promise<import("../entities/content-publish.entity").ContentPublish[]>;
    getUpcomingPublishes(limit?: number): Promise<import("../entities/content-publish.entity").ContentPublish[]>;
    getPublishById(publishId: string): Promise<import("../entities/content-publish.entity").ContentPublish>;
    deletePublish(publishId: string): Promise<{
        success: boolean;
    }>;
}
