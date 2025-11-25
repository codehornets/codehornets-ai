import { CampaignSchedulingService } from '../services/campaign-scheduling.service';
import { CreateCampaignScheduleDto, UpdateCampaignScheduleDto } from '../dto/campaign-schedule.dto';
export declare class CampaignSchedulingController {
    private readonly schedulingService;
    constructor(schedulingService: CampaignSchedulingService);
    findByCampaignId(campaignId: string): Promise<import("../entities/campaign-schedule.entity").CampaignScheduleEntity | null>;
    create(data: CreateCampaignScheduleDto): Promise<import("../entities/campaign-schedule.entity").CampaignScheduleEntity>;
    update(id: string, data: UpdateCampaignScheduleDto): Promise<import("../entities/campaign-schedule.entity").CampaignScheduleEntity>;
    delete(id: string): Promise<void>;
    activate(id: string): Promise<import("../entities/campaign-schedule.entity").CampaignScheduleEntity>;
    pause(id: string): Promise<import("../entities/campaign-schedule.entity").CampaignScheduleEntity>;
}
