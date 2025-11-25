import { LeadActivitiesService } from './lead-activities.service';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { FilterLeadActivityDto } from './dto/filter-lead-activity.dto';
export declare class LeadActivitiesController {
    private readonly leadActivitiesService;
    constructor(leadActivitiesService: LeadActivitiesService);
    findAll(filters?: FilterLeadActivityDto): Promise<{
        data: import("./lead-activity.entity").LeadActivity[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<import("./lead-activity.entity").LeadActivity>;
    create(createLeadActivityDto: CreateLeadActivityDto): Promise<import("./lead-activity.entity").LeadActivity>;
    findByLeadId(leadId: string): Promise<import("./lead-activity.entity").LeadActivity[]>;
}
