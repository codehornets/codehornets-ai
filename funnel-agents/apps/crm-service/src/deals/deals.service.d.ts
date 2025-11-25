import { Repository } from 'typeorm';
import { Deal } from './deal.entity';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { UpdateDealStageDto } from './dto/update-deal-stage.dto';
import { FilterDealDto } from './dto/filter-deal.dto';
export declare class DealsService {
    private dealsRepository;
    constructor(dealsRepository: Repository<Deal>);
    findAll(filters?: FilterDealDto): Promise<{
        data: Deal[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Deal>;
    create(createDealDto: CreateDealDto): Promise<Deal>;
    update(id: string, updateDealDto: UpdateDealDto): Promise<Deal>;
    remove(id: string): Promise<void>;
    updateStage(id: string, updateDealStageDto: UpdateDealStageDto): Promise<Deal>;
}
