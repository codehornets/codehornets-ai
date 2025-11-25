import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryContentDto } from './dto/query-content.dto';
export declare class ContentController {
    private readonly contentService;
    constructor(contentService: ContentService);
    create(createContentDto: CreateContentDto, payload?: CreateContentDto): Promise<import("./entities/content.entity").Content>;
    findAll(query: QueryContentDto, payload?: QueryContentDto): Promise<{
        data: import("./entities/content.entity").Content[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string, payload?: {
        id: string;
    }): Promise<import("./entities/content.entity").Content>;
    update(id: string, updateContentDto: UpdateContentDto, payload?: {
        id: string;
        data: UpdateContentDto;
    }): Promise<import("./entities/content.entity").Content>;
    updateStatus(id: string, updateStatusDto: UpdateStatusDto, payload?: {
        id: string;
        data: UpdateStatusDto;
    }): Promise<import("./entities/content.entity").Content>;
    remove(id: string, payload?: {
        id: string;
    }): Promise<{
        success: boolean;
    }>;
}
