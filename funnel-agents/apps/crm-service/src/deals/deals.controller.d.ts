import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { UpdateDealStageDto } from './dto/update-deal-stage.dto';
import { FilterDealDto } from './dto/filter-deal.dto';
export declare class DealsController {
    private readonly dealsService;
    constructor(dealsService: DealsService);
    findAll(filters?: FilterDealDto): Promise<{
        data: import("./deal.entity").Deal[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<import("./deal.entity").Deal>;
    create(createDealDto: CreateDealDto): Promise<import("./deal.entity").Deal>;
    update(payload: {
        id: string;
        data: UpdateDealDto;
    }): Promise<import("./deal.entity").Deal>;
    remove(id: string): Promise<void>;
    updateStage(payload: {
        id: string;
        data: UpdateDealStageDto;
    }): Promise<import("./deal.entity").Deal>;
}
