import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { FilterLeadDto } from './dto/filter-lead.dto';
export declare class LeadsController {
    private readonly leadsService;
    constructor(leadsService: LeadsService);
    findAll(filters?: FilterLeadDto): Promise<{
        data: import("..").Lead[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<import("..").Lead>;
    create(createLeadDto: CreateLeadDto): Promise<import("..").Lead>;
    update(payload: {
        id: string;
        data: UpdateLeadDto;
    }): Promise<import("..").Lead>;
    remove(id: string): Promise<void>;
    qualify(id: string): Promise<import("..").Lead>;
    convert(id: string): Promise<import("..").Lead>;
}
