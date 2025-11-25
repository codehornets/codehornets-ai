import { Repository } from 'typeorm';
import { ContentPublish } from '../entities/content-publish.entity';
import { Content } from '../entities/content.entity';
import { SchedulePublishDto, UpdatePublishStatusDto, CancelPublishDto } from '../dto/publish.dto';
export declare class PublishService {
    private readonly publishRepository;
    private readonly contentRepository;
    constructor(publishRepository: Repository<ContentPublish>, contentRepository: Repository<Content>);
    schedulePublish(dto: SchedulePublishDto): Promise<ContentPublish>;
    updatePublishStatus(publishId: string, dto: UpdatePublishStatusDto): Promise<ContentPublish>;
    cancelPublish(publishId: string, dto: CancelPublishDto): Promise<ContentPublish>;
    getContentPublishes(contentId: string): Promise<ContentPublish[]>;
    getScheduledPublishes(limit?: number): Promise<ContentPublish[]>;
    getUpcomingPublishes(limit?: number): Promise<ContentPublish[]>;
    getPublishById(publishId: string): Promise<ContentPublish>;
    deletePublish(publishId: string): Promise<void>;
    formatContentForChannel(content: Content, channel: string): string;
}
