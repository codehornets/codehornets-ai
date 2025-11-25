import { Repository } from 'typeorm';
import { LeadActivity } from './lead-activity.entity';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { FilterLeadActivityDto } from './dto/filter-lead-activity.dto';
export declare class LeadActivitiesService {
    private leadActivitiesRepository;
    constructor(leadActivitiesRepository: Repository<LeadActivity>);
    findAll(filters?: FilterLeadActivityDto): Promise<{
        data: LeadActivity[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<LeadActivity>;
    create(createLeadActivityDto: CreateLeadActivityDto): Promise<LeadActivity>;
    findByLeadId(leadId: string): Promise<LeadActivity[]>;
}
