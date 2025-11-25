import { Repository } from 'typeorm';
import { Lead } from '@funnelagents/domain';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { FilterLeadDto } from './dto/filter-lead.dto';
export declare class LeadsService {
    private leadsRepository;
    constructor(leadsRepository: Repository<Lead>);
    findAll(filters?: FilterLeadDto): Promise<{
        data: Lead[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Lead>;
    create(createLeadDto: CreateLeadDto): Promise<Lead>;
    update(id: string, updateLeadDto: UpdateLeadDto): Promise<Lead>;
    remove(id: string): Promise<void>;
    qualify(id: string): Promise<Lead>;
    convert(id: string): Promise<Lead>;
}
